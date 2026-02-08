import Link from "next/link";
import { protocolIds, protocols } from "@/protocols";

export default function ProtocolLabsIndexPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-100">
        Protocol labs
      </h1>
      <p className="text-neutral-400">
        Choose a protocol to enter its world. Each lab is self-contained. No
        protocol data, UI, or logic leaks across worlds.
      </p>
      <ul className="flex flex-col gap-2" role="list">
        {protocolIds.map((id) => {
          const p = protocols[id];
          return (
            <li key={p.id}>
              <Link
                href={`/protocol/${p.id}`}
                className="block rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 transition hover:border-neutral-700 hover:bg-neutral-900"
              >
                <span className="font-medium text-neutral-100">{p.name}</span>
                <span className="ml-2 text-sm text-neutral-500">
                  {p.metadata.category} · {p.metadata.status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
