"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { byId, cards as decks, type Card, type Deck } from "@/lib/data";
import { read, type Spread } from "@/lib/engine";
import { firebaseReady, saveReading } from "@/lib/firebase";

const spreads: {
  id: Spread;
  name: string;
  note: string;
  count: number;
  deck?: Deck;
}[] = [
  { id: "three", name: "Ba lá", note: "Nền · Chuyển · Hướng", count: 3 },
  { id: "five", name: "Năm lá", note: "Thuận · Cản · Kết", count: 5 },
  { id: "nine", name: "Ma trận 9", note: "Toàn cảnh có trọng tâm", count: 9 },
  {
    id: "grand",
    name: "Grand Tableau",
    note: "Toàn bộ 36 nhà",
    count: 36,
    deck: "lenormand",
  },
];
function Face({
  c,
  small = false,
  onClick,
  active = false,
}: {
  c: Card;
  small?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`face ${small ? "small" : ""} ${active ? "active" : ""} ${c.suit === "hearts" || c.suit === "diamonds" ? "red" : ""}`}
    >
      <b>{c.code}</b>
      <i>{c.icon}</i>
      <span>{c.name}</span>
    </Tag>
  );
}
function Back() {
  return (
    <div className="back">
      <span>✦</span>
    </div>
  );
}
function CameraBox({
  deck,
  onAdd,
  onClose,
}: {
  deck: Deck;
  onAdd: (x: Card[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState("Đang mở camera...");
  useEffect(() => {
    let live = true;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then(async (s) => {
        if (!live) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        if (ref.current) {
          ref.current.srcObject = s;
          await ref.current.play();
        }
        setState("");
      })
      .catch(() =>
        setState("Không mở được camera. Hãy cấp quyền hoặc nhập thủ công."),
      );
    return () => {
      live = false;
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function scan() {
    if (!ref.current?.videoWidth) return;
    setState("Đang nhận diện lá bài...");
    const v = ref.current,
      cv = document.createElement("canvas"),
      scale = Math.min(1, 1400 / v.videoWidth);
    cv.width = v.videoWidth * scale;
    cv.height = v.videoHeight * scale;
    cv.getContext("2d")?.drawImage(v, 0, 0, cv.width, cv.height);
    try {
      const r = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck, image: cv.toDataURL("image/jpeg", 0.85) }),
      });
      const d = (await r.json()) as {
        cards?: { id: string }[];
        error?: string;
      };
      if (!r.ok) throw Error(d.error);
      const found = (d.cards || [])
        .map((x) => byId.get(x.id))
        .filter(Boolean) as Card[];
      if (!found.length)
        throw Error("Chưa thấy lá hợp lệ. Hãy chụp gần và tránh lóa.");
      onAdd(found);
      setState(`Đã nhận diện ${found.length} lá. Hãy kiểm tra lại thứ tự.`);
    } catch (e) {
      setState(e instanceof Error ? e.message : "Không đọc được ảnh.");
    }
  }
  return (
    <div className="modal">
      <section>
        <header>
          <div>
            <em>AI CARD VISION</em>
            <h2>Quét thứ tự lá bài</h2>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <div className="camera">
          <video ref={ref} muted playsInline />
          <div className="scanline" />
          <div className="frame" />
        </div>
        <p>
          Đặt bài thẳng hàng; hệ thống đọc từ trái sang phải, trên xuống dưới.
        </p>
        {state && <aside>{state}</aside>}
        <button className="primary" onClick={scan}>
          ⌗ Chụp & nhận diện
        </button>
      </section>
    </div>
  );
}
function TypeText({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const timer = window.setInterval(() => {
      i = Math.min(text.length, i + 3);
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [text, active]);
  return (
    <>
      {shown}
      {active && shown.length < text.length && <i className="cursor" />}
    </>
  );
}
function OracleReading({
  result,
  question,
  deck,
  onReset,
  saved,
}: {
  result: ReturnType<typeof read>;
  question: string;
  deck: Deck;
  onReset: () => void;
  saved: string;
}) {
  const [phase, setPhase] = useState(0);
  const [follow, setFollow] = useState("");
  const [followAnswer, setFollowAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (phase >= 6) return;
    const timer = window.setTimeout(
      () => setPhase((x) => x + 1),
      phase === 0 ? 900 : 1800,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);
  async function askFollow() {
    if (!follow.trim() || asking) return;
    setAsking(true);
    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          deck,
          cards: result.details.map((d) => d.card),
          base: result,
          followUp: follow,
          previousAnswer: [
            result.directAnswer,
            result.overview,
            result.thread,
            result.direction,
          ].join(" "),
        }),
      });
      const data = (await response.json()) as {
        followUp?: { answer?: string; caution?: string };
        error?: string;
      };
      if (!response.ok) throw Error(data.error);
      setFollowAnswer(
        `${data.followUp?.answer || ""}${data.followUp?.caution ? `\n\nLưu ý: ${data.followUp.caution}` : ""}`,
      );
    } catch (e) {
      setFollowAnswer(
        e instanceof Error ? e.message : "Không thể trả lời tiếp lúc này.",
      );
    } finally {
      setAsking(false);
    }
  }
  return (
    <section className="results oracle-scene">
      <div className="dust" aria-hidden>
        {Array.from({ length: 30 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `-${(i % 9) * 0.7}s`,
              animationDuration: `${6 + (i % 7)}s`,
            }}
          />
        ))}
      </div>
      <button className="backlink" onClick={onReset}>
        ← Trải câu hỏi mới
      </button>
      <div className="oracle-stage">
        <div className="oracle-ring" />
        <div className="oracle-cards">
          {result.details.map((d, i) => (
            <div
              key={i}
              style={{
                transform: `translateX(-50%) rotate(${(i - (result.details.length - 1) / 2) * Math.min(12, 72 / result.details.length)}deg) translateY(${Math.abs(i - (result.details.length - 1) / 2) * 4}px)`,
                zIndex: i,
              }}
            >
              <Face c={d.card} small={result.details.length > 9} />
            </div>
          ))}
        </div>
        <div className="oracle-seal">✦</div>
      </div>
      <header className="oracle-title">
        <em>{deck.toUpperCase()} · LỜI PHÁN ĐANG HIỆN</em>
        <h1>Thầy phán như sau...</h1>
        <p>“{question}”</p>
        <button onClick={() => setPhase(6)}>Hiện toàn bộ lời luận</button>
      </header>
      <div className="oracle-dialogue" aria-live="polite">
        {phase >= 1 && (
          <article className="prophecy lead">
            <small>TRẢ LỜI THẲNG</small>
            <h2>
              <TypeText text={result.directAnswer} active={phase >= 1} />
            </h2>
          </article>
        )}
        {phase >= 2 && (
          <article className="prophecy">
            <small>THẾ BÀI ĐANG NÓI</small>
            <p>
              <TypeText
                text={`${result.context} ${result.overview}`}
                active={phase >= 2}
              />
            </p>
          </article>
        )}
        {phase >= 3 && (
          <article className="prophecy">
            <small>MẠCH CHUYỂN ĐỘNG</small>
            <p>
              <TypeText
                text={`${result.thread} ${result.direction}`}
                active={phase >= 3}
              />
            </p>
          </article>
        )}
        {phase >= 4 && (
          <article className="prophecy action">
            <small>ĐIỀU NÊN LÀM</small>
            <p>
              <TypeText text={result.action} active={phase >= 4} />
            </p>
          </article>
        )}
        {phase >= 5 && (
          <article className="prophecy warning">
            <small>ĐIỀU PHẢI DÈ CHỪNG</small>
            <p>
              <TypeText text={result.caution} active={phase >= 5} />
            </p>
            <b>{result.verdict}</b>
          </article>
        )}
        {phase < 6 && (
          <div className="oracle-thinking">
            <span />
            <span />
            <span /> Thầy đang nối mạch bài...
          </div>
        )}
      </div>
      {phase >= 6 && (
        <div className="meaning-reveal">
          <header>
            <em>SAU KHI LUẬN XONG</em>
            <h2>Ý nghĩa và sự liên kết của các lá</h2>
            <p>
              Phần này giải thích vì sao trải bài đưa ra lời phán phía trên.
            </p>
          </header>
          <details open>
            <summary>
              ⌁ Mạch kết hợp giữa các lá <span>›</span>
            </summary>
            {result.evidence.map((text, i) => (
              <article key={i}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <div>
                  <strong>
                    {result.details[i]?.card.name} →{" "}
                    {result.details[i + 1]?.card.name}
                  </strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </details>
          <details>
            <summary>
              ▤ Ý nghĩa chi tiết từng vị trí <span>›</span>
            </summary>
            {result.details.map((d, i) => (
              <article key={i}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <div>
                  <strong>
                    {d.card.name} · {d.position}
                  </strong>
                  <p>{d.text}</p>
                  <small>Từ khóa: {d.card.keys.join(" · ")}</small>
                </div>
              </article>
            ))}
          </details>
          <div className="followup">
            <em>HỎI TIẾP TRÊN TRẢI BÀI NÀY</em>
            <h3>Bạn còn muốn hỏi rõ điều gì?</h3>
            <textarea
              value={follow}
              onChange={(e) => setFollow(e.target.value)}
              placeholder="Ví dụ: Khoản tiền nào đang là rủi ro lớn nhất, và tôi nên xử lý trước ra sao?"
            />
            <button
              className="primary"
              onClick={askFollow}
              disabled={!follow.trim() || asking}
            >
              {asking ? "Thầy đang xem tiếp..." : "✦ Hỏi câu tiếp theo"}
            </button>
            {followAnswer && (
              <article>
                <small>THẦY LUẬN TIẾP</small>
                <p>{followAnswer}</p>
              </article>
            )}
          </div>
          <p className="disclaimer">
            Kết quả mang tính chiêm nghiệm và tham khảo, không thay thế tư vấn y
            tế, pháp lý hoặc tài chính chuyên môn.
          </p>
        </div>
      )}
      {saved && <div className="toast">◇ {saved}</div>}
    </section>
  );
}
export default function Home() {
  const [step, setStep] = useState<
    "setup" | "ritual" | "pick" | "loading" | "result"
  >("setup");
  const [deck, setDeck] = useState<Deck>("lenormand");
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<Spread>("three");
  const [chosen, setChosen] = useState<Card[]>([]);
  const [search, setSearch] = useState("");
  const [path, setPath] = useState<"virtual" | "physical">("virtual");
  const [ritualSpreadChosen, setRitualSpreadChosen] = useState(false);
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [camera, setCamera] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof read> | null>(null);
  const [saved, setSaved] = useState("");
  const count = spreads.find((s) => s.id === spread)?.count || 3;
  const pool = decks[deck];
  const filtered = useMemo(
    () =>
      pool.filter((c) =>
        (c.name + c.code + c.keys.join(" "))
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [pool, search],
  );
  function setDeckSafe(d: Deck) {
    setDeck(d);
    setChosen([]);
    if (d === "playing" && spread === "grand") setSpread("nine");
  }
  function toggle(c: Card) {
    setChosen((x) =>
      x.some((a) => a.id === c.id)
        ? x.filter((a) => a.id !== c.id)
        : x.length < count
          ? [...x, c]
          : x,
    );
  }
  function shuffle() {
    setChosen([...pool].sort(() => Math.random() - 0.5).slice(0, count));
  }
  function drawVirtual() {
    if (chosen.length >= count) return;
    const remaining = pool.filter((c) => !chosen.some((x) => x.id === c.id));
    const card = remaining[Math.floor(Math.random() * remaining.length)];
    if (card) setChosen((x) => [...x, card]);
  }
  function interpret() {
    if (chosen.length !== count) return;
    setStep("loading");
    setStage(0);
    setTimeout(() => setStage(1), 700);
    setTimeout(() => setStage(2), 1500);
    setTimeout(async () => {
      const base = read(question, deck, spread, chosen);
      let final = base;
      try {
        const response = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, deck, spread, cards: chosen, base }),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            result?: Partial<ReturnType<typeof read>>;
          };
          if (data.result) final = { ...base, ...data.result };
        }
      } catch {}
      setResult(final);
      setStep("result");
      try {
        const ok = await saveReading({
          question,
          deck,
          spread,
          cards: chosen.map((c) => c.id),
          verdict: final.verdict,
          score: final.score,
        });
        setSaved(ok ? "Đã lưu vào Firebase" : "Bản mẫu chưa nối Firebase");
      } catch {
        setSaved("Không thể lưu lịch sử");
      }
    }, 2200);
  }
  function reset() {
    setStep("setup");
    setChosen([]);
    setRitualSpreadChosen(false);
    setResult(null);
    setSaved("");
  }
  return (
    <main>
      <div className="stars" />
      <header className="top">
        <button className="brand" onClick={reset}>
          <i>✦</i>
          <span>
            <b>ORACLE 36</b>
            <small>LENORMAND · BÀI TÂY</small>
          </span>
        </button>
        <div className="status">
          <span>◉ {firebaseReady ? "FIREBASE ONLINE" : "DEMO MODE"}</span>
          <span>◇ LUẬN THEO DỮ LIỆU</span>
        </div>
      </header>
      {step === "setup" && (
        <section className="hero">
          <div className="intro">
            <em>TRẢI BÀI TRỰC TUYẾN · 36 LÁ</em>
            <h1>
              Đặt câu hỏi.
              <br />
              <i>Để các lá nói thẳng.</i>
            </h1>
            <p>
              Hai hệ luận độc lập, đọc đúng thứ tự lá và vị trí trải. Xào bài
              số, nhập bài thật hoặc quét trực tiếp bằng camera.
            </p>
            <div className="proof">
              <span>✓ 36 Lenormand</span>
              <span>✓ Bài Tây 6–A</span>
              <span>✓ Luận theo câu hỏi</span>
            </div>
            <div className="floating">
              <Back />
              <Back />
              <Back />
            </div>
          </div>
          <div className="form">
            <header>
              <span>01</span>
              <h2>Chuẩn bị câu hỏi</h2>
            </header>
            <label>
              CÂU HỎI
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ví dụ: Trong 3 tháng tới, công việc hiện tại sẽ chuyển biến thế nào?"
                maxLength={240}
              />
            </label>
            <label>HỆ BÀI</label>
            <div className="decks">
              <button
                className={deck === "lenormand" ? "on" : ""}
                onClick={() => setDeckSafe("lenormand")}
              >
                <i>☾</i>
                <span>
                  <b>Lenormand 36</b>
                  <small>Biểu tượng · tổ hợp · mạch nối</small>
                </span>
              </button>
              <button
                className={deck === "playing" ? "on" : ""}
                onClick={() => setDeckSafe("playing")}
              >
                <i>♠</i>
                <span>
                  <b>Bài Tây 36</b>
                  <small>6, 7, 8, 9, 10, J, Q, K, A</small>
                </span>
              </button>
            </div>
            <label>HÌNH THỨC XEM BÀI</label>
            <div className="readingpaths">
              <button
                className={path === "virtual" ? "on" : ""}
                onClick={() => setPath("virtual")}
              >
                <i>✦</i>
                <span>
                  <b>Bóc bài trực tiếp 3D</b>
                  <small>Tự xào, trải bài úp và chọn từng lá</small>
                </span>
              </button>
              <button
                className={path === "physical" ? "on" : ""}
                onClick={() => setPath("physical")}
              >
                <i>⌗</i>
                <span>
                  <b>Nhập bộ bài thật</b>
                  <small>Nhập thủ công hoặc nhận diện bằng camera</small>
                </span>
              </button>
            </div>
            <button
              disabled={!question.trim()}
              className="primary wide"
              onClick={() => {
                setChosen([]);
                setRitualSpreadChosen(false);
                setStep(path === "virtual" ? "ritual" : "pick");
              }}
            >
              {path === "virtual"
                ? "Bắt đầu xào và trải bài →"
                : "Nhập các lá bài thật →"}
            </button>
          </div>
        </section>
      )}
      {step === "ritual" && (
        <section className="ritualflow">
          <div className="ritualdust" aria-hidden />
          <button className="backlink" onClick={() => setStep("setup")}>
            ← Đổi câu hỏi hoặc hệ bài
          </button>
          <header className="ritualhead">
            <em>NGHI THỨC BÓC BÀI TRỰC TIẾP</em>
            <h1>Thành tâm nghĩ về câu hỏi</h1>
            <p>“{question}”</p>
          </header>
          <div className="ritualspread">
            <div className="ritualsteps">
              <span className="done">1 · Chọn hệ bài</span>
              <span className="done">2 · Đặt câu hỏi</span>
              <span className={ritualSpreadChosen ? "done" : "on"}>
                3 · Chọn kiểu trải
              </span>
              <span className={ritualSpreadChosen ? "on" : ""}>
                4 · Bóc từng lá
              </span>
            </div>
            <div className="spreadchoice">
              {spreads
                .filter((s) => !s.deck || s.deck === deck)
                .map((s) => (
                  <button
                    className={
                      ritualSpreadChosen && spread === s.id ? "on" : ""
                    }
                    key={s.id}
                    onClick={() => {
                      setSpread(s.id);
                      setChosen([]);
                      setRitualSpreadChosen(true);
                    }}
                  >
                    <i>
                      {Array.from(
                        { length: Math.min(s.count, 9) },
                        (_, i) => (
                          <b key={i} />
                        ),
                      )}
                    </i>
                    <strong>{s.name}</strong>
                    <small>{s.note}</small>
                  </button>
                ))}
            </div>
            <div
              className={`ritualarena ${ritualSpreadChosen ? "ready" : ""}`}
            >
              <div className="ritualhalo" />
              <div className="fullfan">
                {Array.from({ length: 24 }, (_, i) => (
                  <button
                    key={i}
                    disabled={!ritualSpreadChosen || chosen.length >= count}
                    onClick={drawVirtual}
                    style={{
                      transform: `translateX(-50%) rotate(${(i - 11.5) * 5.5}deg) translateY(${Math.abs(i - 11.5) * 2.4}px)`,
                      animationDelay: `${i * 35}ms`,
                    }}
                    aria-label={`Chọn lá bài úp ${i + 1}`}
                  >
                    <Back />
                  </button>
                ))}
              </div>
              <div className="chosen3d">
                {Array.from({ length: ritualSpreadChosen ? count : 0 }, (_, i) =>
                  chosen[i] ? (
                    <div className="pickedcard" key={chosen[i].id}>
                      <Face c={chosen[i]} small={count > 9} />
                      <small>{i + 1}</small>
                    </div>
                  ) : (
                    <div className="pickedempty" key={i}>
                      {i + 1}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="ritualinstruction">
              <div>
                <em>
                  {!ritualSpreadChosen
                    ? "BÀI ĐÃ ĐƯỢC XÀO VÀ BUNG RA"
                    : chosen.length < count
                      ? `ĐANG BÓC LÁ ${chosen.length + 1}/${count}`
                      : "ĐÃ NHẬN ĐỦ CÁC LÁ"}
                </em>
                <h2>
                  {!ritualSpreadChosen
                    ? "Chọn kiểu trải trước khi chạm vào bài"
                    : chosen.length < count
                      ? "Chạm vào một lá úp theo trực giác"
                      : "AI đã nhận đủ trải bài của bạn"}
                </h2>
              </div>
              <button
                className="primary"
                disabled={chosen.length !== count}
                onClick={interpret}
              >
                ✦ Tiến hành luận bài
              </button>
            </div>
          </div>
        </section>
      )}
      {step === "pick" && (
        <section className="pick">
          <button className="backlink" onClick={() => setStep("setup")}>
            ← Sửa câu hỏi
          </button>
          <div className="picktitle">
            <em>02 · THIẾT LẬP TRẢI BÀI</em>
            <h1>Chọn cách đặt các lá</h1>
            <p>“{question}”</p>
          </div>
          <div className="workspace">
            <aside className="controls">
              <label>KIỂU TRẢI</label>
              {spreads
                .filter((s) => !s.deck || s.deck === deck)
                .map((s) => (
                  <button
                    className={spread === s.id ? "on" : ""}
                    key={s.id}
                    onClick={() => {
                      setSpread(s.id);
                      setChosen((x) => x.slice(0, s.count));
                    }}
                  >
                    <i>
                      {Array.from({ length: Math.min(s.count, 9) }, (_, i) => (
                        <b key={i} />
                      ))}
                    </i>
                    <span>
                      <strong>{s.name}</strong>
                      <small>{s.note}</small>
                    </span>
                  </button>
                ))}
              <label>CÁCH NHẬP</label>
              <div className="modes">
                <button
                  className={mode === "manual" ? "on" : ""}
                  onClick={() => setMode("manual")}
                >
                  ◎ Nhập tay
                </button>
                <button
                  className={mode === "camera" ? "on" : ""}
                  onClick={() => setMode("camera")}
                >
                  ⌗ Camera
                </button>
              </div>
              <button
                className="shuffle"
                onClick={() => {
                  setChosen([]);
                  shuffle();
                }}
              >
                ⤨{" "}
                <span>
                  <b>Xào & rút ngẫu nhiên</b>
                  <small>Dùng bộ bài số</small>
                </span>
              </button>
            </aside>
            <article className="table">
              <header>
                <div>
                  <b>THỨ TỰ TRẢI</b>
                  <p>Chọn đúng thứ tự lá đã lật.</p>
                </div>
                <strong>
                  {chosen.length}/{count} LÁ
                </strong>
              </header>
              <div className={`slots ${count > 9 ? "many" : ""}`}>
                {Array.from({ length: count }, (_, i) =>
                  chosen[i] ? (
                    <div className="slot" key={i}>
                      <Face c={chosen[i]} small={count > 9} />
                      <button onClick={() => toggle(chosen[i])}>×</button>
                    </div>
                  ) : (
                    <div className="empty" key={i}>
                      <b>{i + 1}</b>
                      <small>CHƯA CÓ</small>
                    </div>
                  ),
                )}
              </div>
              {mode === "manual" ? (
                <div className="picker">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="⌕ Tìm theo tên, số hoặc từ khóa..."
                  />
                  <div>
                    {filtered.map((c) => (
                      <Face
                        key={c.id}
                        c={c}
                        small
                        onClick={() => toggle(c)}
                        active={chosen.some((x) => x.id === c.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cameraentry">
                  <i>⌗</i>
                  <div>
                    <em>CAMERA RECOGNITION</em>
                    <h3>Quét bài thật, giữ nguyên thứ tự</h3>
                    <p>Luôn có bước kiểm tra lại trước khi luận.</p>
                  </div>
                  <button className="primary" onClick={() => setCamera(true)}>
                    Mở camera
                  </button>
                </div>
              )}
              <footer>
                <span>
                  ●{" "}
                  {chosen.length === count
                    ? "Đã đủ lá, sẵn sàng đọc mạch."
                    : `Cần thêm ${count - chosen.length} lá.`}
                </span>
                <button
                  className="primary"
                  disabled={chosen.length !== count}
                  onClick={interpret}
                >
                  ✦ Luận trải bài
                </button>
              </footer>
            </article>
          </div>
        </section>
      )}
      {step === "loading" && (
        <section className="loader">
          <div className="shuffleanim">
            {Array.from({ length: 7 }, (_, i) => (
              <Back key={i} />
            ))}
          </div>
          <em>ORACLE ENGINE · 36</em>
          <h2>{["Đang xào bài", "Đang đọc mạch", "Đang kết luận"][stage]}</h2>
          <p>
            {
              [
                "Tách nhiễu khỏi câu hỏi",
                "Nối vị trí và tương tác giữa các lá",
                "Chuyển tín hiệu thành lời khuyên thực tế",
              ][stage]
            }
          </p>
          <div className="progress">
            {["Xào bài", "Đọc mạch", "Kết luận"].map((x, i) => (
              <span className={i <= stage ? "on" : ""} key={x}>
                <b>{i < stage ? "✓" : i + 1}</b>
                {x}
              </span>
            ))}
          </div>
        </section>
      )}
      {step === "result" && result && (
        <OracleReading
          result={result}
          question={question}
          deck={deck}
          onReset={reset}
          saved={saved}
        />
      )}
      {camera && (
        <CameraBox
          deck={deck}
          onAdd={(x) =>
            setChosen((c) =>
              [...c, ...x.filter((n) => !c.some((o) => o.id === n.id))].slice(
                0,
                count,
              ),
            )
          }
          onClose={() => setCamera(false)}
        />
      )}
      <footer className="footer">
        <span>ORACLE 36 · KNOWLEDGE ENGINE v1.0</span>
        <span>CHIÊM NGHIỆM CÓ CẤU TRÚC · KHÔNG PHÁN ĐỊNH MỆNH</span>
      </footer>
    </main>
  );
}
