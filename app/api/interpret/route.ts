import {NextResponse} from "next/server";

type CardInput={name:string;code:string;keys:string[];positive:string;shadow:string;tone:number};
type ReadingInput={question:string;deck:string;spread:string;cards:CardInput[];base?:Record<string,unknown>;followUp?:string;previousAnswer?:string};

const system=`Bạn là một thầy luận bài Việt Nam giàu kinh nghiệm, nói tự nhiên, sâu và thẳng nhưng không hù dọa.
Mục tiêu: trả lời ĐÚNG câu hỏi cụ thể của người hỏi dựa trên toàn bộ trải bài, không viết kiểu từ điển, không ghép câu máy móc.
Quy tắc:
- Mở đầu bằng kết luận trực tiếp cho chính câu hỏi, không vòng vo.
- Mỗi nhận định phải liên kết rõ với ít nhất một lá, vị trí hoặc tổ hợp lá.
- Phân biệt hiện trạng, xu hướng sắp tới, điều kiện làm thay đổi kết quả và hành động thực tế.
- Nếu hỏi tài chính, phải nói rõ dòng tiền/thu nhập/chi tiêu/rủi ro/cơ hội và khung thời gian được hỏi; không chuyển sang tình cảm.
- Nếu hỏi tình cảm, tách cảm xúc, hành động, cam kết và trở ngại.
- Không bịa sự kiện chắc chắn, ngày chính xác, bệnh, hành vi phạm pháp hoặc lợi nhuận đầu tư.
- Viết tiếng Việt tự nhiên như đang trực tiếp nói với một người, dùng "bạn", không nhắc AI hay thuật toán.
- Lời luận chi tiết, có sắc thái riêng của đúng bộ lá này; tránh các câu chung như "hãy suy nghĩ tích cực".
Chỉ trả JSON hợp lệ, không markdown.`;

function extractText(raw:{output?:Array<{content?:Array<{type?:string;text?:string}>}>}){
 return(raw.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text||"").join("").replace(/^```json\s*|\s*```$/g,"");
}

export async function POST(req:Request){
 try{
  const body=await req.json() as ReadingInput;
  if(!body.question||!body.cards?.length)return NextResponse.json({error:"Thiếu câu hỏi hoặc lá bài."},{status:400});
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"Chưa cấu hình OPENAI_API_KEY."},{status:503});
  const follow=body.followUp?.trim();
  const task=follow
   ?`Đây là câu hỏi gốc: "${body.question}". Trải bài: ${JSON.stringify(body.cards)}. Lời luận trước: ${body.previousAnswer||JSON.stringify(body.base)}. Người hỏi hỏi tiếp: "${follow}". Trả lời tiếp dựa trên đúng trải bài cũ, không rút bài mới. JSON: {"answer":"4-7 đoạn cụ thể, tự nhiên, bám câu hỏi tiếp theo","caution":"một lưu ý ngắn nếu cần"}.`
   :`Câu hỏi nguyên văn: "${body.question}". Hệ bài: ${body.deck}. Kiểu trải: ${body.spread}. Các lá theo đúng thứ tự và vị trí: ${JSON.stringify(body.cards)}. Tín hiệu tính toán tham khảo: ${JSON.stringify(body.base)}.
Trả JSON đúng cấu trúc:
{"directAnswer":"2-4 câu trả lời thẳng đúng câu hỏi","context":"2-3 câu xác định hoàn cảnh và thời gian","overview":"một đoạn phân tích nguyên nhân và hiện trạng","thread":"một đoạn luận toàn mạch và các tổ hợp nổi bật","direction":"một đoạn dự báo xu hướng sắp tới có điều kiện","action":"một đoạn hành động cụ thể, khả thi","caution":"một đoạn rủi ro cần tránh","verdict":"một câu kết luận ngắn","evidence":["3-6 luận điểm, mỗi luận điểm nêu rõ cặp hoặc cụm lá làm căn cứ"]}.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_INTERPRET_MODEL||"gpt-5.6-sol",reasoning:{effort:"low"},text:{verbosity:"high"},instructions:system,input:task,max_output_tokens:4200})});
  if(!response.ok)return NextResponse.json({error:"Không thể tạo lời luận lúc này."},{status:502});
  const parsed=JSON.parse(extractText(await response.json())) as Record<string,unknown>;
  return NextResponse.json(follow?{followUp:parsed}:{result:parsed});
 }catch{return NextResponse.json({error:"Lời luận chưa thể hoàn tất. Hãy thử lại."},{status:500})}
}
