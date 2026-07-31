export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-200 bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 text-xs text-ink-500 sm:flex-row sm:px-6">
        <p>&copy; {new Date().getFullYear()} Merquellantas. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
