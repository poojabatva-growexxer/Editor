export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80',
    ghost:   'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    danger:  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950',
    outline: 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    icon: 'p-1.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}