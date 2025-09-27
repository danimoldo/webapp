// js/rtls.js
import AssetsAdd from './add-assets.js';
export class RTLSClient{
 constructor(state){this.state=state||{};}
 start(){AssetsAdd.start();}
 stop(){AssetsAdd.stop();}
 addForklift(...a){return AssetsAdd.addForklift(...a);}
 addLifter(...a){return AssetsAdd.addLifter(...a);}
 addExtinguisher(...a){return AssetsAdd.addExtinguisher(...a);}
 setScale(...a){return AssetsAdd.setScale(...a);}
 getState(){return AssetsAdd.getState();}
}
export default RTLSClient;
