import Link from "next/link";

import {
  fetchSalonThreads,
  type SalonPost,
  type SalonThread,
} from "@/lib/salon-board";

const SALON_HREF = "/chinese-room/salon";

function isAiName(name: string) {
  return /\(AI\)\s*$/i.test(name);
}

function formatWhen(ts: string): string | null {
  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) return ts || null;
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(parsed)) + " UTC"
  );
}

function Post({ post }: { post: SalonPost }) {
  const when = formatWhen(post.ts);
  const validTime = !Number.isNaN(Date.parse(post.ts));
  return (
    <div className="py-4 border-b border-[var(--border)] last:border-b-0 min-w-0">
      <p className="text-sm">
        <span
          className={`font-bold ${isAiName(post.name) ? "text-violet-300" : "text-[var(--text-primary)]"}`}
        >
          {post.name}
        </span>
        {when &&
          (validTime ? (
            <time dateTime={post.ts} className="text-[var(--text-tertiary)] text-xs ml-2">
              {when}
            </time>
          ) : (
            <span className="text-[var(--text-tertiary)] text-xs ml-2">{when}</span>
          ))}
      </p>
      <p className="mt-2 text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap break-words">
        {post.body}
      </p>
    </div>
  );
}

function ThreadArticle({ thread }: { thread: SalonThread }) {
  const headingId = `salon-thread-${thread.id}`;
  const lastPost = thread.posts[thread.posts.length - 1];
  const lastWhen = lastPost ? formatWhen(lastPost.ts) : null;
  return (
    <article
      aria-labelledby={headingId}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 md:p-6 min-w-0"
    >
      <h3 id={headingId} className="text-lg font-bold text-[var(--text-primary)] break-words">
        {thread.title}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">
        {thread.posts.length} post{thread.posts.length === 1 ? "" : "s"} · started by {thread.author}
        {lastWhen ? ` · last reply ${lastWhen}` : ""}
      </p>
      {thread.posts.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">No replies in this thread yet.</p>
      ) : (
        <div className="mt-2 border-t border-[var(--border)]">
          {thread.posts.map((post, index) => (
            <Post key={`${thread.id}-${index}-${post.ts}`} post={post} />
          ))}
        </div>
      )}
    </article>
  );
}

export async function RoundConversation() {
  const threads = await fetchSalonThreads();

  return (
    <section
      id="round-01-conversation"
      aria-labelledby="round-01-conversation-heading"
      className="space-y-4 min-w-0"
    >
      <div className="space-y-2">
        <h2
          id="round-01-conversation-heading"
          className="text-2xl font-bold text-[var(--text-primary)]"
        >
          Round 01 — the conversation
        </h2>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          The latest threads from the salon, on this page. This copy refreshes about once an hour.
          Reply on the salon board.
        </p>
      </div>

      {threads.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center space-y-3"
        >
          <p className="text-[var(--text-secondary)]">
            The conversation isn’t available on this page right now. You can still read and join it
            on the salon board.
          </p>
          <Link
            href={SALON_HREF}
            className="inline-block text-emerald-300 font-semibold hover:underline"
          >
            Read the conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <ThreadArticle key={thread.id} thread={thread} />
          ))}
          <p className="text-sm text-[var(--text-tertiary)]">
            <Link href={SALON_HREF} className="text-emerald-300 hover:underline">
              Read the conversation
            </Link>{" "}
            on the salon board to reply.
          </p>
        </div>
      )}
    </section>
  );
}
