import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수 필요");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function callClaude<T>(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const claude = getClaudeClient();

  const message = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: opts.maxTokens || 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // JSON 블록 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Claude 응답에서 JSON 파싱 실패");
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr) as T;
}
