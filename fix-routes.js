const fs = require('fs');
const p = 'C:\\Users\\User\\Desktop\\Imp Project\\Rovor\\chatbot\\src\\routeTree.gen.ts';
let c = fs.readFileSync(p, 'utf8');
const oldStr = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute\n  '/admin/chatbots': typeof AdminChatbotsRoute\n";
const newStr = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute\n  '/admin/scan-status/$botId': typeof AdminScanStatusBotIdRoute\n  '/admin/chatbots': typeof AdminChatbotsRoute\n";
c = c.replace(oldStr, newStr);
fs.writeFileSync(p, c);
console.log('done');
