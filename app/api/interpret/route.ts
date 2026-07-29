import { NextResponse } from "next/server";

type CardInput = {
  id?: string;
  name: string;
  code: string;
  keys: string[];
  positive: string;
  shadow: string;
  tone: number;
};
type ReadingInput = {
  question: string;
  deck: string;
  spread: string;
  cards: CardInput[];
  extraCards?: CardInput[];
  base?: Record<string, unknown>;
  followUp?: string;
  previousAnswer?: string;
};

const system = `Bạn là một thầy luận bài Việt Nam giàu kinh nghiệm, nói tự nhiên, sâu và thẳng nhưng không hù dọa.
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
- Phải luận RIÊNG từng lá theo đúng vị trí, vai trò và mối liên hệ với câu hỏi. Không được chỉ chép nghĩa từ khóa của lá.
- Với lá trợ nghĩa, phải nói rõ lá đó đang làm sáng tỏ, xác nhận, phủ định hay điều chỉnh điểm nào của lời luận trước.
- Nếu các lá mâu thuẫn hoặc chưa đủ rõ, ghi needsClarifier=true thay vì cố kết luận.
Chỉ trả JSON hợp lệ, không markdown.`;

function extractText(raw: {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  return (raw.output || [])
    .flatMap((x) => x.content || [])
    .filter((x) => x.type === "output_text")
    .map((x) => x.text || "")
    .join("")
    .replace(/^```json\s*|\s*```$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReadingInput;
    if (!body.question || !body.cards?.length)
      return NextResponse.json(
        { error: "Thiếu câu hỏi hoặc lá bài." },
        { status: 400 },
      );
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        { error: "Chưa cấu hình OPENAI_API_KEY." },
        { status: 503 },
      );
    const follow = body.followUp?.trim();
    const task = follow
      ? `Câu hỏi gốc: "${body.question}". Các lá của trải chính theo thứ tự: ${JSON.stringify(body.cards)}. Lời luận trước: ${body.previousAnswer || JSON.stringify(body.base)}.
Người hỏi hỏi tiếp: "${follow}".
Các lá trợ nghĩa vừa bổ sung, theo đúng thứ tự bóc/nhập: ${JSON.stringify(body.extraCards || [])}.
Hãy trả lời sâu câu hỏi tiếp theo bằng cách nối trải chính với từng lá trợ nghĩa. Không được bỏ qua lá nào. Nếu không có lá trợ nghĩa, chỉ suy luận từ trải chính.
JSON: {"answer":"5-9 đoạn cụ thể, mỗi đoạn đi vào một khía cạnh của câu hỏi tiếp theo","cardAnalysis":[{"name":"tên lá trợ nghĩa hoặc lá chính liên quan","role":"điểm mà lá đang làm rõ","analysis":"phân tích sâu theo ngữ cảnh, tối thiểu 3 câu"}],"needsClarifier":false,"caution":"một lưu ý thực tế, không chung chung"}.`
      : `Câu hỏi nguyên văn: "${body.question}". Hệ bài: ${body.deck}. Kiểu trải: ${body.spread}. Các lá theo đúng thứ tự và vị trí: ${JSON.stringify(body.cards)}. Tín hiệu tính toán tham khảo: ${JSON.stringify(body.base)}.
Trả JSON đúng cấu trúc:
{"directAnswer":"3-5 câu trả lời thẳng đúng câu hỏi","context":"một đoạn xác định hoàn cảnh, đối tượng và thời gian","overview":"2-3 đoạn phân tích nguyên nhân và hiện trạng","thread":"2-3 đoạn luận toàn mạch và các tổ hợp nổi bật","direction":"một đoạn dự báo xu hướng sắp tới có điều kiện","action":"một đoạn hành động cụ thể, khả thi","caution":"một đoạn rủi ro cần tránh","verdict":"một câu kết luận ngắn","evidence":["4-8 luận điểm, mỗi luận điểm nêu rõ cặp hoặc cụm lá làm căn cứ"],"cardAnalysis":[{"name":"tên lá","position":"vị trí trong trải","analysis":"phân tích riêng tối thiểu 3 câu, bám trực tiếp câu hỏi và liên hệ lá trước/sau"}],"needsClarifier":false}.`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_INTERPRET_MODEL || "gpt-5.6-sol",
        reasoning: { effort: "medium" },
        text: { verbosity: "high" },
        instructions: system,
        input: task,
        max_output_tokens: 6500,
      }),
    });
    if (!response.ok)
      return NextResponse.json(
        { error: "Không thể tạo lời luận lúc này." },
        { status: 502 },
      );
    const parsed = JSON.parse(extractText(await response.json())) as Record<
      string,
      unknown
    >;
    return NextResponse.json(
      follow ? { followUp: parsed } : { result: parsed },
    );
  } catch {
    return NextResponse.json(
      { error: "Lời luận chưa thể hoàn tất. Hãy thử lại." },
      { status: 500 },
    );
  }
}
