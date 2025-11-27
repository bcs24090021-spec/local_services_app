interface CategoryCardProps {
  title: string;
  image: string;
  icon: string;
  onClick?: () => void;
}

export function CategoryCard({ title, image, icon, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md active:scale-95 transition-all"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center overflow-hidden">
        <span className="text-3xl">{icon}</span>
      </div>
      <span className="text-xs text-center">{title}</span>
    </button>
  );
}
