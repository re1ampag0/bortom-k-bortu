// Source-localization inventory. Comments, regexes and matching/replacement patterns stay intact.
import ts from 'typescript';import{readFileSync,writeFileSync,readdirSync,mkdirSync}from'node:fs';import{join}from'node:path';
const rows=[];function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):/\.tsx?$/.test(e.name)?[join(dir,e.name)]:[])}
for(const file of files('src/ui')){const source=readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[];
function visit(n){if(ts.isStringLiteral(n)||ts.isJsxText(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)){
 const start=n.getStart(tree),end=n.getEnd(),text=source.slice(start,end);const call=n.parent;
 const matcher=ts.isCallExpression(call)&&ts.isPropertyAccessExpression(call.expression)&&['includes','startsWith','endsWith','replace','match','split','indexOf','lastIndexOf'].includes(call.expression.name.text);
 if(!matcher&&text.includes('—')&&(/[А-Яа-яЁё]/.test(text)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))){const next=text.replace(/\s*—\s*/g,': ');edits.push({start,end,next});rows.push({file,line:tree.getLineAndCharacterOfPosition(start).line+1,before:text,after:next});}}
 ts.forEachChild(n,visit)}visit(tree);let next=source;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.next+next.slice(e.end);if(edits.length)writeFileSync(file,next);
}mkdirSync('docs/measurements/ui-polish',{recursive:true});writeFileSync('docs/measurements/ui-polish/words.json',JSON.stringify(rows,null,2));console.log(rows.length,'UI string changes');
