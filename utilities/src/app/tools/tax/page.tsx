export default function TaxToolPage() {
  return (
    <main className="h-screen w-screen">
      <iframe
        title="Tax Calculator"
        src="/apps/tax/index.html"
        className="h-full w-full border-0"
      />
    </main>
  );
}
