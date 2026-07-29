import type { Card,Deck } from "./data";
export type Spread="three"|"five"|"nine"|"grand";
type Domain="tình cảm"|"công việc"|"tài chính"|"gia đình"|"học tập"|"sức khỏe"|"pháp lý"|"tổng quát";
type Intent="có-không"|"thời điểm"|"cảm xúc"|"lựa chọn"|"diễn biến"|"lời khuyên";

const positions={three:["Nền tảng của vấn đề","Chuyển biến đang diễn ra","Kết quả gần nhất"],five:["Căn nguyên","Điều đang hỗ trợ","Trọng tâm quyết định","Điều đang cản trở","Hướng kết quả"],nine:["Gốc quá khứ","Dư âm còn lại","Điều đang hình thành","Hoàn cảnh hiện tại","Trung tâm câu hỏi","Tác động bên ngoài","Việc nên làm","Điều nên tránh","Xu hướng kết quả"],grand:Array.from({length:36},(_,i)=>`Nhà ${i+1}`)};
const domainWords:Record<Exclude<Domain,"tổng quát">,string[]>={"tình cảm":["yêu","tình cảm","người ấy","người yêu","mối quan hệ","quay lại","kết hôn","crush","chồng","vợ"],"công việc":["công việc","sự nghiệp","công ty","sếp","đồng nghiệp","thăng chức","nghỉ việc","dự án","phỏng vấn"],"tài chính":["tiền","tài chính","đầu tư","kinh doanh","thu nhập","nợ","lợi nhuận","mua","bán"],"gia đình":["gia đình","cha","mẹ","con","anh chị","họ hàng","nhà cửa"],"học tập":["học","thi","điểm","trường","đại học","chứng chỉ","tốt nghiệp"],"sức khỏe":["sức khỏe","bệnh","điều trị","phẫu thuật","hồi phục","cơ thể"],"pháp lý":["pháp lý","kiện","hồ sơ","thủ tục","hợp đồng","tranh chấp","tòa"]};
const includesAny=(text:string,words:string[])=>words.some(w=>text.includes(w));

function analyzeQuestion(question:string){
 const q=question.toLocaleLowerCase("vi").trim();
 const domain=(Object.entries(domainWords).find(([,words])=>includesAny(q,words))?.[0]||"tổng quát") as Domain;
 let intent:Intent="diễn biến";
 if(/^(có|liệu|phải chăng)|\bkhông\b|\bđược không\b|\bcó nên\b/.test(q))intent="có-không";
 if(includesAny(q,["khi nào","bao giờ","tháng nào","năm nào","thời điểm"]))intent="thời điểm";
 if(includesAny(q,["nghĩ gì","cảm thấy","có yêu","tình cảm của","ý định của"]))intent="cảm xúc";
 if(includesAny(q,["chọn","hay là","nên tiếp tục","nên nghỉ","quyết định"]))intent="lựa chọn";
 if(includesAny(q,["làm gì","làm sao","thế nào để","lời khuyên"]))intent="lời khuyên";
 const time=q.match(/(?:trong|từ nay đến|đến)\s+(\d+\s*(?:ngày|tuần|tháng|năm)|[^,.?]{2,28})/i)?.[1]||q.match(/(?:tháng|quý|năm)\s+\d{1,4}/i)?.[0]||"giai đoạn gần sắp tới";
 return{domain,intent,time};
}
function conclusion(score:number){return score>55?"Khả năng thuận lợi cao":score>25?"Có cửa tiến triển, nhưng phải đi đúng điều kiện":score>-15?"Kết quả chưa cố định, lựa chọn hiện tại sẽ quyết định":score>-45?"Khả năng gặp trở ngại cao, cần đổi cách tiếp cận":"Chưa thuận ở thời điểm này"}
function direct(intent:Intent,score:number,last:Card,domain:Domain){
 if(intent==="có-không")return score>25?`Có, xu hướng hiện tại nghiêng về khả năng đạt được điều bạn hỏi trong ${domain}; tuy nhiên kết quả chỉ vững khi bạn thực hiện đúng điều kiện được nêu bên dưới.`:score<-25?`Chưa. Mạch bài hiện tại không ủng hộ việc kỳ vọng kết quả xảy ra theo cách bạn đang hình dung; cần xử lý nút thắt trước khi hỏi lại về kết quả.`:`Chưa thể trả lời tuyệt đối có hay không. Cán cân còn nằm ở một quyết định hoặc thông tin chưa xuất hiện, vì vậy hành động tiếp theo của bạn có thể đổi kết quả.`;
 if(intent==="thời điểm")return`Trải bài không chỉ ra ngày giờ tuyệt đối. Dấu hiệu thời điểm đến khi năng lượng của ${last.name.toLowerCase()} xuất hiện rõ: ${last.keys.join(", ")}. Trước dấu hiệu này, thúc ép dễ làm sai nhịp.`;
 if(intent==="cảm xúc")return`Cảm xúc có tồn tại nhưng không hoàn toàn đồng nghĩa với cam kết. Mạch bài tách rõ điều được thể hiện ra ngoài và ý định hành động để tránh tự suy diễn.`;
 if(intent==="lựa chọn")return score>=0?`Phương án có tính mở rộng và chủ động hơn đang có lợi, miễn là bạn đặt giới hạn rõ ràng và kiểm tra dữ kiện trước khi cam kết.`:`Chưa nên chốt vội. Phương án an toàn hơn lúc này là giảm rủi ro, giữ quyền lựa chọn và đợi nút thắt chính được làm rõ.`;
 if(intent==="lời khuyên")return`Việc quan trọng nhất không phải cố đoán kết quả, mà là tác động đúng vào điểm đang chi phối câu hỏi. Hãy ưu tiên hành động có thể kiểm chứng thay vì phản ứng theo lo lắng.`;
 return`Diễn biến có xu hướng ${score>20?"mở ra và tiến về phía tích cực":score<-20?"chậm lại để buộc bạn xử lý một trở ngại thật":"thay đổi theo quyết định sắp tới"}. Kết quả gần nhất được dẫn bởi ${last.name}: ${last.tone<0?last.shadow:last.positive}`;
}
function pairText(a:Card,b:Card,domain:Domain){
 const keys=`${a.keys[0]} → ${b.keys[0]}`;
 if(a.tone<0&&b.tone>0)return`${a.name} đi cùng ${b.name} cho thấy khó khăn về ${a.keys[0]} có lối mở qua ${b.keys[0]}; đây là mạch phục hồi, không phải thuận lợi tức thì.`;
 if(a.tone>0&&b.tone<0)return`${a.name} nối sang ${b.name}: cơ hội ban đầu có thật nhưng dễ bị giảm lực bởi ${b.keys[0]}. Trong ${domain}, cần giữ thành quả trước khi mở rộng.`;
 if(a.tone<0&&b.tone<0)return`${a.name} + ${b.name} tạo nút thắt “${keys}”. Hai cảnh báo củng cố nhau, vì vậy không nên xem đây chỉ là lo lắng nhất thời.`;
 if(a.tone>0&&b.tone>0)return`${a.name} + ${b.name} tạo mạch nâng đỡ “${keys}”. Hai tín hiệu cùng chiều giúp khả năng thuận lợi có cơ sở rõ hơn.`;
 return`${a.name} nối ${b.name} cho thấy ${keys}; kết quả phụ thuộc vào cách bạn xử lý chuyển tiếp giữa hai yếu tố này.`;
}
export function read(question:string,deck:Deck,spread:Spread,cards:Card[]){
 const analysis=analyzeQuestion(question),raw=cards.reduce((sum,c)=>sum+c.tone,0)/(Math.max(1,cards.length)*2)*100;
 const trajectory=(cards.at(-1)?.tone||0)-(cards[0]?.tone||0),score=Math.max(-100,Math.min(100,Math.round(raw+trajectory*5)));
 const center=cards[Math.floor(cards.length/2)],last=cards.at(-1)!,strongest=[...cards].sort((a,b)=>b.tone-a.tone)[0],weakest=[...cards].sort((a,b)=>a.tone-b.tone)[0];
 const plus=cards.filter(c=>c.tone>0).length,minus=cards.filter(c=>c.tone<0).length,neutral=cards.length-plus-minus,pos=positions[spread];
 const evidence=cards.slice(0,-1).map((c,i)=>pairText(c,cards[i+1],analysis.domain));
 return{score,verdict:conclusion(score),
  context:`Câu hỏi được đọc theo chủ đề ${analysis.domain}, dạng hỏi ${analysis.intent.replace("-","/")} và khung thời gian “${analysis.time}”. Trải bài chỉ tập trung vào trọng tâm này, không luận lan sang vấn đề ngoài câu hỏi.`,
  directAnswer:direct(analysis.intent,score,last,analysis.domain),
  overview:`Lá trung tâm ${center.name} cho biết yếu tố chi phối nhất là ${center.keys.join(" và ")}. ${center.tone<0?center.shadow:center.positive} Điều này tác động trực tiếp đến câu hỏi “${question}”, nên kết quả phụ thuộc cách yếu tố trung tâm được xử lý.`,
  thread:`Toàn mạch có ${plus} lá nâng đỡ, ${minus} lá cảnh báo và ${neutral} lá trung tính. ${deck==="lenormand"?"Lenormand được đọc theo chuỗi biểu tượng liền nhau":"Bài Tây được đọc theo nhịp số, cấp bậc và bốn chất"}; hướng mạch ${trajectory>0?"đi lên, phần cuối sáng hơn phần đầu":trajectory<0?"đi xuống, trở ngại tăng nếu giữ cách cũ":"đi ngang, chưa có lực đủ mạnh để tự đổi tình hình"}.`,
  direction:`Trong ${analysis.time}, hướng gần nhất đi qua ${last.name}: ${last.tone<0?last.shadow:last.positive} ${score>20?"Khả năng tiến triển có cơ sở, nhưng cần giữ đúng điều kiện của lá này.":score<-20?"Nếu không đổi cách xử lý, đây là điểm dễ trở thành kết quả thực tế.":"Tình hình còn mở và phản ứng mạnh với quyết định kế tiếp."}`,
  action:`Ưu tiên ${strongest.name.toLowerCase()}: ${strongest.advice} Hãy biến điều này thành một hành động có thể kiểm chứng, rồi quan sát phản hồi trước khi đi bước lớn hơn.`,
  caution:`Điểm rủi ro nằm ở ${weakest.name}: ${weakest.shadow} Không dùng trải bài để thay thế dữ kiện, đối thoại trực tiếp hoặc tư vấn chuyên môn khi câu hỏi liên quan sức khỏe, pháp lý hay tài chính lớn.`,
  evidence:evidence.slice(0,spread==="grand"?8:Math.max(2,evidence.length)),
  details:cards.map((c,i)=>({card:c,position:pos[i]||`Vị trí ${i+1}`,text:`Ở vị trí “${pos[i]||`Vị trí ${i+1}`}”, ${c.name} nói về ${c.keys.join(", ")}. ${c.tone<0?c.shadow:c.positive} Liên hệ với câu hỏi về ${analysis.domain}, lá này ${i<Math.floor(cards.length/2)?"mô tả nguyên nhân hoặc điều đã tạo nên tình hình":i===Math.floor(cards.length/2)?"xác định điểm phải tập trung ngay lúc này":"cho thấy hệ quả hoặc hướng phát triển nếu mạch hiện tại tiếp tục"}.`}))
 };
}
