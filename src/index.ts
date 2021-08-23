import Debug from 'debug'
const debug = Debug('debug')
import { parse, babelParse, walk, SFCBlock } from '@vue/compiler-sfc'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { Node } from '@babel/traverse'

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
            sourceType: 'module'
        })
        let componentDeclarationNode : Node|undefined = undefined
        let setupFunctionNode : Node|undefined = undefined
        const componentChildrenNode = new WeakSet()
        walk(ast, { enter(node, parent) {
            if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'ObjectExpression') {
                debug('Found default export: component with object declaration')
                const declarationNode = node.declaration
                componentChildrenNode.add(declarationNode)
                componentDeclarationNode = declarationNode
            } 
            if (
              node.type === 'ExportDefaultDeclaration' &&
              node.declaration.type === 'CallExpression' &&
              node.declaration.callee.name === 'defineComponent'
            ) {
              debug(
                'Found default export: component with defineComponent declaration'
              )
              const declarationNode = node.declaration.arguments[0]
              componentChildrenNode.add(declarationNode)
              componentDeclarationNode = declarationNode
            } 
            const isIntoAComponent = componentChildrenNode.has(parent)
            if (isIntoAComponent) {
                componentChildrenNode.add(node)
                if (
                  'key' in node &&
                  node.key.name === 'setup' &&
                  parent === componentDeclarationNode
                ) {
                  debug('Found setup function')
                  setupFunctionNode = node // get inside block
                  this.remove()
                }
            }
        } })
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
            }
        })
        const scriptSetupCodeAst = t.program(setupFunctionNode.body.body)
        const regularScriptBlock = componentDeclarationNode.properties.length && {
            type: 'script',
            attrs: codeScript.attrs,
            content: generate(ast).code
        }
        const scriptSetupCode = generate(scriptSetupCodeAst).code
        const { attrs } = codeScript
        const attrsString = Object.keys(attrs).map(k => `${k}="${attrs[k]}"`).join(' ')
        const blocks = [
            ...(regularScriptBlock ? [printBlock(regularScriptBlock)] : []),
            `<script ${attrsString} setup>
${scriptSetupCode}
</script>`,
            ...(parsedCode.descriptor.template ? [printBlock(parsedCode.descriptor.template)] : []),
            ...parsedCode.descriptor.styles.map(printBlock),
            ...parsedCode.descriptor.customBlocks.map(printBlock)
        ]
        return blocks.join('\n')
        
    } catch (e) {
        debug('Failed to parse component')
        throw e
    }
    return code
}