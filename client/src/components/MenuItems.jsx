import { NavLink } from "react-router-dom"
import { menuItemsData } from "../assets/assets"

const MenuItems = ({ setSidebarOpen }) => {
    return (
        <div className="px-6 text-gray-600 space-y-1 font-medium">
            {menuItemsData.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)}
                    className="relative px-3.5 py-2 flex items-center gap-3 rounded-xl overflow-hidden group">
                    {({ isActive }) => (
                        <>
                            <span className={`absolute inset-0 rounded-xl transition-transform duration-300 ease-out
                                ${isActive ? "bg-indigo-100 scale-x-100 origin-left" : "bg-indigo-50 scale-x-0 group-hover:scale-x-100 origin-left"}`}></span>
                            <span className={`relative flex items-center gap-3 transition duration-300 ease-out transform
                                ${isActive ? "text-indigo-700 scale-110" : "text-gray-600 group-hover:text-indigo-700 group-hover:scale-105"}`}>
                                <Icon className="w-5 h-5" />
                                {label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </div>
    )
}

export default MenuItems
