// Isolated UI fixture: the real Game/LocalGame and the existing unit starting states.
// Served only by a local Vite dev server; no import from the application, no production route.
import {createRoot} from 'react-dom/client';
import {Game} from '../../src/ui/game/Game';
import {LocalGame} from '../../src/net/local';
import {useStage} from '../../src/ui/stage';
import {data,turnOf,act,POSITIONS,cardIn} from '../../tests/helpers';
import '../../src/ui/fonts';
import '../../src/ui/styles.css';
import '../../src/ui/game/game.css';
import '../../src/ui/game/alarm.css';
import '../../src/ui/game/charge.css';
import '../../src/ui/game/logbook.css';
import '../../src/ui/game/phone.css';
const which=new URLSearchParams(location.search).get('panel')??'jack';
const game=new LocalGame(data,{game:{seed:1,variant:'standard',sea:false,legends:true,positions:POSITIONS},players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true});
if(which==='jack') {
 const s=turnOf('КОМПАНИЯ');s.ships['Ж'].tracks.hull=2;
 game.state=act(s,{type:'volley',ship:'И',target:'Ж'}).state;
 if(game.state.pending?.kind!=='jack')throw new Error('Jack fixture did not reach the real decision');
}
if(which==='choice') {
 const s=turnOf('ПИРАТЫ',{Ж:['Компас Джека']});
 game.state=act(s,{type:'playCard',seat:'Ж',card:cardIn(s,'Ж','Компас Джека')}).state;
 if(game.state.pending?.kind!=='choice')throw new Error('Compass fixture did not reach the real choice');
}
(window as unknown as {ui4Game:LocalGame}).ui4Game=game;
function Preview(){return <div id="stage" style={useStage()??undefined}><Game game={game} onExit={()=>{}} onRestart={()=>{}} /></div>}
createRoot(document.getElementById('root')!).render(<Preview/>);
