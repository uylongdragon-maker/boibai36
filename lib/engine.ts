import type { Card,Deck } from "./data";
export type Spread="three"|"five"|"nine"|"grand";
const positions={three:["Nền đang có","Điều đang chuyển","Hướng gần nhất"],five:["Căn nguyên","Lực thuận","Trọng tâm","Lực cản","Hướng mở"],nine:["Gốc quá khứ","Ảnh hưởng cũ","Điều hình thành","Bối cảnh","Trung tâm","Bên ngoài","Nên làm","Nên tránh","Xu hướng"],grand:Array.from({length:36},(_,i)=>`Nhà ${i+1}`)};
export function read(question:string,deck:Deck,spread:Spread,cards:Card[]){
 const score=Math.round(cards.reduce((s,c)=>s+c.tone,0)/(cards.length*2)*100); const center=cards[Math.floor(cards.length/2)], last=cards.at(-1)!;
 const verdict=score>40?"Thuận — có cửa tiến rõ":score>10?"Nghiêng thuận — cần đúng nhịp":score>-10?"Chưa ngã ngũ — phụ thuộc lựa chọn":score>-40?"Nghiêng khó — nên điều chỉnh":"Cản mạnh — chưa nên ép kết quả";
 const pos=positions[spread]; const plus=cards.filter(c=>c.tone>0).length, minus=cards.filter(c=>c.tone<0).length;
 return {score,verdict,overview:`Trọng tâm nằm ở ${center.name}: ${center.positive} Với câu hỏi “${question}”, đây là yếu tố đang chi phối mạnh nhất.`,thread:`Mạch ${deck==="lenormand"?"Lenormand được đọc theo chuỗi biểu tượng":"Bài Tây được đọc theo chất và cấp độ"}: ${plus} lá nâng đỡ, ${minus} lá cảnh báo. ${plus>=minus?"Cơ hội có thật nhưng cần nối đúng các bước.":"Nút thắt nên được xử lý trước khi thúc kết quả."}`,direction:`Hướng gần nhất đi qua ${last.name}: ${last.tone<0?last.shadow:last.positive}`,action:[...cards].sort((a,b)=>b.tone-a.tone)[0].advice,caution:[...cards].sort((a,b)=>a.tone-b.tone)[0].shadow,details:cards.map((c,i)=>({card:c,position:pos[i]||`Vị trí ${i+1}`,text:c.tone<0?c.shadow:c.positive}))};
}
