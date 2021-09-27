import Debug from 'debug'
const debug = Debug('debug')
import { parse, babelParse, walk, SFCBlock } from '@vue/compiler-sfc'
import generate from '@babel/generator'
import * as t from '@babel/types'
import traverse, { Node } from '@babel/traverse'
import template from '@babel/template'
import { PassThrough } from 'stream'

function printBlock (block: Pick<SFCBlock, 'attrs'|'type'|'content'>) {
    const attrsString = Object.keys(block.attrs)
        .map(k => {
            const value = block.attrs[k]
            if (typeof value === 'boolean') return k 
            return `${k}="${value}"`
        })
        .join(' ')
    const tagString = [block.type]
    if (attrsString) tagString.push(attrsString)
    const normalizedBlock = block.content.replace(/^\n(.*)\n$/s, '$1')
    return [`<${tagString.join(' ')}>`, normalizedBlock, `</${block.type}>`].join('\n')
}
export default function transformCode (code: string): string {
    try {
      const parsedCode = parse(code)
      if (parsedCode.descriptor.scriptSetup) {
        debug('Already built with script setup, aborting transformation')
        return code
      }
      const codeScript = parsedCode.descriptor.script!
      const ast = babelParse(codeScript.content, {
        sourceType: 'module',
        plugins: ['typescript'],
      })      
      let componentDeclarationNode: Node | undefined = undefined
      let setupFunctionNode: Node | undefined = undefined
      let propsDeclarationNode: Node | undefined = undefined
      let emitsDeclarationNode: Node | undefined = undefined
      traverse(ast, {
        ExportDefaultDeclaration(path) {
          const { node } = path
          if (node.declaration.type === 'ObjectExpression') {
            debug('Found default export: component with object declaration')
            const declarationNode = node.declaration
            componentDeclarationNode = declarationNode
          } else if (node.declaration.type === 'CallExpression' &&
            node.declaration.callee.name === 'defineComponent') {
            debug('Found default export: component with defineComponent declaration')
            const declarationNode = node.declaration.arguments[0]
            componentDeclarationNode = declarationNode
          }
          if (componentDeclarationNode) {
            path.stop();
            path.traverse({
              enter(path) {
                const { node, parent } = path
                  if (
                    'key' in node &&
                    node.key.name === 'setup' &&
                    parent === componentDeclarationNode
                  ) {
                    debug('Found setup function')
                    setupFunctionNode = node // get inside block
                    path.remove()
                  }
                  if (
                    'key' in node &&
                    node.key.name === 'props' &&
                    parent === componentDeclarationNode
                  ) {
                    debug('Found props declaration')
                    propsDeclarationNode = node.value
                    path.remove()
                  }
                  if (
                    'key' in node &&
                    node.key.name === 'emits' &&
                    parent === componentDeclarationNode
                  ) {
                    debug('Found emits declaration')
                    emitsDeclarationNode = node.value
                    path.remove()
                  }
                  if (
                    'key' in node &&
                    node.key.name === 'components' &&
                    parent === componentDeclarationNode
                  ) {
                    debug('Found components declaration')
                    path.remove()
                  }
              },
            })
          }
        },
      })
      if (!componentDeclarationNode) {
        throw new Error('No valid component declaration found')
      }
      if (!setupFunctionNode) {
        debug('No setup function found, aborting transformation')
        return code
      }
      // transform setup block: remove return and get rid of outer block
      walk(setupFunctionNode, {
        enter(node) {
          if (node.type === 'ReturnStatement') {
            this.remove()
          }
        },
      })
      const scriptSetupCodeAst = t.program(setupFunctionNode.body.body)
      // handle emits
      if (propsDeclarationNode) {
        const propsTemplate = template('const emit = defineEmits(%%emits%%)')
        const ast = propsTemplate({
          emits: emitsDeclarationNode,
        })        
        scriptSetupCodeAst.body.unshift(ast)
      }
      // handle props
      if (propsDeclarationNode) {
        const propsTemplate = template('const props = defineProps(%%props%%)')
        const ast = propsTemplate({
          props: propsDeclarationNode,
        })        
        scriptSetupCodeAst.body.unshift(ast)
      }

      const regularScriptBlock = componentDeclarationNode.properties.length && {
        type: 'script',
        attrs: codeScript.attrs,
        content: generate(ast).code,
      }
      const setupScriptBlock = {
        type: 'script',
        attrs: {
          ...codeScript.attrs,
          setup: true as true,
        },
        content: generate(scriptSetupCodeAst).code,
      }
      const blocks = [
        ...(regularScriptBlock ? [printBlock(regularScriptBlock)] : []),
        printBlock(setupScriptBlock),
        ...(parsedCode.descriptor.template
          ? [printBlock(parsedCode.descriptor.template)]
          : []),
        ...parsedCode.descriptor.styles.map(printBlock),
        ...parsedCode.descriptor.customBlocks.map(printBlock),
      ]
      return blocks.join('\n')
    } catch (e) {
        debug('Failed to parse component')
        throw e
    }
    return code
}