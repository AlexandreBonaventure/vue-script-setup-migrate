import transformCode from '../src/index.ts';
import * as fs from 'fs';
import * as path from 'path';

function testInOut(fixtureName:string) {
    const inComponent = fs.readFileSync(
      path.resolve(__dirname, `./fixtures/${fixtureName}.in.vue`),
      'utf8'
    )
    const outComponent = fs.readFileSync(
      path.resolve(__dirname, `./fixtures/${fixtureName}.out.vue`),
      'utf8'
    )
    const res = transformCode(inComponent)
    expect(res).toBe(outComponent)
}

test('Basics', () => {
    testInOut('basic')
})
test('with defineComponent', () => {
    testInOut('defineComponent')
})
test('without setup', () => {
    testInOut('withoutSetup')
})