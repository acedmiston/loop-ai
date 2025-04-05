import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="py-6 text-sm text-center text-gray-500">
      <div className="inline-flex items-baseline justify-center space-x-2">
        <span>© {new Date().getFullYear()}</span>
        <Logo size="sm" />
        <span>• Plans change. Stay connected.</span>
      </div>
    </footer>
  );
}
