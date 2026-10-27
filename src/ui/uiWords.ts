/** Display-only grammar; persisted public log records and game data stay unchanged. */
export function uiWords(text:string):string {
 return text.replace(/(Море: [^\n]+? \([^)]*\))\s*—\s*([^\n]+)/gu,(_all,head:string,effect:string)=>`${head}. ${effect.charAt(0).toLocaleUpperCase('ru')}${effect.slice(1)}`).replace(/\s*—\s*/g,': ').replace(/(добирает|добрать) (\d+) карт[ауы]?(?=\s|[.,:;!?]|$)/gu,(_all,verb:string,n:string)=>{const value=Number(n),last=value%10,teen=value%100;return `${verb} ${n} ${last===1&&teen!==11?'карту':last>=2&&last<=4&&(teen<12||teen>14)?'карты':'карт'}`;});
}
