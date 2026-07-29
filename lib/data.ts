export type Deck = "lenormand" | "playing";
export type Card = { id:string; deck:Deck; code:string; name:string; icon:string; keys:string[]; positive:string; shadow:string; advice:string; tone:number; suit?:string };

const lenormandRaw: Array<[string,string,string,string,string,string,number]> = [
 ["Kỵ sĩ","🐎","9♥","tin đến, chuyển động","Một tin tức hoặc cơ hội đang tiến đến.","Tin vội, lời hứa chưa chắc chắn.",1],
 ["Cỏ bốn lá","☘","6♦","may nhỏ, cơ hội","Một cơ hội ngắn nhưng đúng lúc xuất hiện.","Dựa quá nhiều vào may mắn.",1],
 ["Con tàu","⛵","10♠","đi xa, mở rộng","Một hành trình hay hướng mới đang mở.","Khoảng cách và chậm trễ.",1],
 ["Ngôi nhà","⌂","K♥","gia đình, nền tảng","Sự ổn định và nền móng được nhấn mạnh.","Khép kín trong vùng an toàn.",1],
 ["Cái cây","♧","7♥","sức khỏe, gốc rễ","Tiến triển chậm nhưng bền nếu được nuôi dưỡng.","Trì trệ hoặc vấn đề kéo dài.",0],
 ["Mây","☁","K♣","mơ hồ, nhiễu","Chưa đủ sáng để kết luận; tình hình còn đổi.","Hiểu lầm và thông tin lẫn lộn.",-1],
 ["Rắn","🐍","Q♣","phức tạp, chiến lược","Cần khôn ngoan và đọc kỹ động cơ.","Ghen tuông, thao túng hoặc cạnh tranh ngầm.",-1],
 ["Quan tài","▰","9♦","kết thúc, chuyển hóa","Một chu kỳ cần khép lại để mở trạng thái mới.","Mất năng lượng và níu kéo điều đã hết.",-2],
 ["Bó hoa","✿","Q♠","món quà, thiện ý","Sự ghi nhận hoặc lời mời tốt đẹp đang đến.","Vẻ đẹp ngắn hạn, làm hài lòng quá mức.",2],
 ["Lưỡi hái","⌁","J♦","cắt nhanh, cảnh báo","Một quyết định dứt khoát giải phóng bế tắc.","Đứt gãy bất ngờ hoặc hành động thiếu cân nhắc.",-1],
 ["Roi","〽","J♣","lặp lại, tranh luận","Điều lặp lại cần được nói thẳng và sửa cách phản ứng.","Xung đột hoặc vòng cãi vã không hồi kết.",-1],
 ["Chim","♩","7♦","trao đổi, lo lắng","Cuộc nói chuyện giữa hai phía quyết định nhịp tiếp theo.","Tin đồn và lo lắng làm méo thông tin.",0],
 ["Đứa trẻ","◌","J♠","khởi đầu, nhỏ","Một khởi đầu mới cần cách tiếp cận đơn giản.","Non kinh nghiệm hoặc ngây thơ.",1],
 ["Cáo","◆","9♣","công việc, tính toán","Hãy thực tế, kiểm tra lợi ích và bằng chứng.","Gian xảo hoặc môi trường việc làm không lành.",-1],
 ["Gấu","●","10♣","quyền lực, tài chính","Nguồn lực mạnh hoặc người có ảnh hưởng đang chi phối.","Kiểm soát, chiếm hữu hoặc áp lực quyền lực.",1],
 ["Ngôi sao","✦","6♥","định hướng, hy vọng","Kế hoạch đang đúng hướng khi giữ nhất quán.","Mơ đẹp nhưng thiếu bước thực tế.",2],
 ["Cò","⌇","Q♥","thay đổi, cải thiện","Sự chuyển dịch có xu hướng cải thiện hoàn cảnh.","Đổi chỉ vì chán hoặc thiếu kế hoạch.",1],
 ["Chó","♢","10♥","trung thành, hỗ trợ","Một người đáng tin đang hỗ trợ câu chuyện.","Phụ thuộc hoặc trung thành mù quáng.",2],
 ["Tòa tháp","▥","6♠","tổ chức, ranh giới","Thể chế, cấp trên hoặc sự độc lập là yếu tố chính.","Cô lập và thủ tục kéo dài.",0],
 ["Khu vườn","❈","8♠","cộng đồng, công khai","Mạng lưới hoặc không gian công khai mở cơ hội.","Chạy theo dư luận và quan hệ bề mặt.",1],
 ["Núi","▲","8♣","trở ngại, chậm","Có một khối cản thật; cần kiên nhẫn hoặc đổi đường.","Bế tắc và cố đâm thẳng vào chỗ không thể đi.",-2],
 ["Ngã rẽ","⑂","Q♦","lựa chọn, nhiều hướng","Một quyết định đang mở các tuyến tương lai khác nhau.","Do dự hoặc muốn giữ mọi lựa chọn.",0],
 ["Chuột","⌁","7♣","hao hụt, bào mòn","Chi tiết nhỏ đang âm thầm hao tiền, thời gian hoặc niềm tin.","Lo âu kéo dài và thất thoát.",-2],
 ["Trái tim","♥","J♥","tình yêu, chân thành","Cảm xúc thật và điều trái tim muốn đang dẫn đường.","Lý tưởng hóa hoặc yêu thiếu ranh giới.",2],
 ["Chiếc nhẫn","○","A♣","cam kết, hợp đồng","Một cam kết hoặc thỏa thuận được nhấn mạnh.","Ràng buộc không lành hoặc lời hứa suông.",1],
 ["Quyển sách","▤","10♦","bí mật, học hỏi","Có dữ kiện còn ẩn và cần nghiên cứu thêm.","Giấu giếm hoặc kết luận khi chưa đọc hết.",0],
 ["Lá thư","✉","7♠","văn bản, hồ sơ","Một tin nhắn hoặc giấy tờ sẽ định hình kết quả.","Sai sót hồ sơ hoặc hiểu nhầm chữ nghĩa.",1],
 ["Người đàn ông","♂","A♥","nhân vật nam, hành động","Một nhân vật nam hoặc phía hành động là trung tâm.","Chờ người khác quyết thay mình.",0],
 ["Người phụ nữ","♀","A♠","nhân vật nữ, cảm nhận","Một nhân vật nữ hoặc phía cảm nhận là trung tâm.","Đoán động cơ khi chưa có dữ kiện.",0],
 ["Hoa ly","⚜","K♠","trưởng thành, bình yên","Cách giải quyết chín chắn và đúng chuẩn mực có lợi.","Lạnh cảm xúc hoặc dùng đạo lý để né vấn đề.",1],
 ["Mặt trời","☀","A♦","thành công, sáng rõ","Khả năng thành công và được nhìn thấy rất mạnh.","Tự tin quá mức hoặc kiệt sức.",2],
 ["Mặt trăng","☾","8♥","cảm xúc, danh tiếng","Trực giác và sự công nhận có ảnh hưởng lớn.","Nhạy cảm quá mức hoặc bất an hình ảnh.",1],
 ["Chìa khóa","⚿","8♦","giải pháp, chắc chắn","Một điểm mấu chốt có thể mở nút thắt.","Ép một lời giải duy nhất.",2],
 ["Cá","≈","K♦","tiền bạc, dòng chảy","Dòng tiền hoặc quyền tự do nguồn lực đang mở rộng.","Tiền đi quá nhanh hoặc ham lợi.",1],
 ["Mỏ neo","⚓","9♠","ổn định, công việc","Sự kiên định tạo kết quả lâu dài.","Bám quá chặt và nhầm quen thuộc với an toàn.",1],
 ["Thập giá","✚","6♣","gánh nặng, bài học","Câu chuyện đòi hỏi trách nhiệm và ý nghĩa.","Gánh thay người khác hoặc tự làm khổ mình.",-2]
];

export const lenormand: Card[] = lenormandRaw.map((r,i)=>({id:`lenormand-${i+1}`,deck:"lenormand",code:String(i+1).padStart(2,"0"),name:r[0],icon:r[1],keys:r[3].split(", "),positive:r[4],shadow:r[5],advice:`Với ${r[0]}, hãy xử lý điều cốt lõi trước khi thúc kết quả.`,tone:r[6]}));

const suits = { hearts:["Cơ","♥",1,"tình cảm và gia đình"], diamonds:["Rô","♦",1,"tiền bạc và tin tức"], clubs:["Chuồn","♣",0,"công việc và hành động"], spades:["Bích","♠",-1,"thử thách và quyết định"] } as const;
const ranks = {"6":["điều chỉnh","Một bước điều chỉnh đang diễn ra."],"7":["kiểm nghiệm","Có phần chưa lộ cần được kiểm tra."],"8":["giao tiếp","Trao đổi và tổ chức sẽ tạo chuyển biến."],"9":["gần hoàn tất","Điều mong cầu đang tiến gần kết quả."],"10":["kết quả","Một chu kỳ đang đạt điểm kết quả."],J:["người trẻ","Một người trẻ hoặc tin mới tác động."],Q:["ảnh hưởng mềm","Một nhân vật nữ hoặc ảnh hưởng tinh tế xuất hiện."],K:["quyền lực","Một người có quyền quyết định đang chi phối."],A:["khởi đầu","Một cánh cửa mới có sức ảnh hưởng lớn."]} as const;
export const playing: Card[] = Object.entries(suits).flatMap(([suit,s])=>Object.entries(ranks).map(([rank,r],ri)=>({id:`playing-${suit}-${rank.toLowerCase()}`,deck:"playing" as const,code:`${rank}${s[1]}`,name:`${rank} ${s[0]}`,icon:s[1],keys:[r[0],s[3]],positive:`${r[1]} Trọng tâm nghiêng về ${s[3]}.`,shadow:`Mặt trái là sự trì hoãn, mất cân bằng hoặc áp lực trong ${s[3]}.`,advice:`Giữ dữ kiện rõ ràng và hành động vừa sức trong ${s[3]}.`,tone:Math.max(-2,Math.min(2,s[2]+(ri>=3&&ri<=5?1:0))),suit})));
export const cards: Record<Deck,Card[]> = {lenormand,playing};
export const byId = new Map([...lenormand,...playing].map(c=>[c.id,c]));
