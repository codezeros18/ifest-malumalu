type Bentuk = "tanpa-penanda" | "lingkaran-setengah" | "lingkaran-kosong";

type LencanaProps = {
  bentuk: Bentuk;
  teks?: string;
  latar?: "kertas" | "latar-kosong";
};

const kelasLatar: Record<NonNullable<LencanaProps["latar"]>, string> = {
  kertas: "bg-kertas",
  "latar-kosong": "bg-latar-kosong",
};

function Bulatan({ bentuk }: { bentuk: Bentuk }) {
  if (bentuk === "tanpa-penanda") {
    return null;
  }

  if (bentuk === "lingkaran-setengah") {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 shrink-0 rounded-full border border-tinta-lembut"
        style={{
          background:
            "linear-gradient(90deg, currentColor 50%, transparent 50%)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-redup"
    />
  );
}

export default function Lencana({
  bentuk,
  teks,
  latar = "kertas",
}: LencanaProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-tinta-lembut",
        kelasLatar[latar],
      ].join(" ")}
    >
      <Bulatan bentuk={bentuk} />
      {teks ? <span>{teks}</span> : null}
    </span>
  );
}
