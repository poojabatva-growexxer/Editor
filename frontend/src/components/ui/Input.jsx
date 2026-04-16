export function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        w-full px-3 py-2 rounded-lg text-sm
        bg-gray-50 dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        text-black dark:text-white
        placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
        transition-all duration-200
        ${className}
      `}
      {...props}
    />
  )
}