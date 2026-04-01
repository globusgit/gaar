import Link from "next/link";
import Image from "next/image";
import layout from "../(main)/layout";

export const menuItems = [
  {icon:"./layout-panel-left.svg", label: 'Dashboard', route: '/dashboard'},
  {icon: "./archive.svg", label: 'Organizations', route: '/organizations'},
  {icon: '/clipboard.svg', label: 'Projects', route: '/projects'},
  {icon: '/caravan.svg', label: 'Clients', route: '/clients'},
  {icon: '/badge-indian-rupee.svg', label: 'Employees', route: '/employees'},
  {icon: '/badge-indian-rupee.svg', label: 'Tenders', route: '/tenders'},
  {icon: './users.svg', label: 'Users', route: '/users'},
  {icon: '/settings.svg', label: 'Settings', route: '/settings'},
]
const Links = () => {
  return (
    <div>
     {menuItems.map(item => (
                <div key={item.label} className="flex flex-col gap-4 ml-1">
                    <Link key={item.label} href={item.route} className="cursor-pointer flex items-center justify-center lg:justify-start gap-4 text-white py-4  hover:bg-amber-100 hover:text-black">
                        <Image src={item.icon} alt="" width={15} height={15} /> 
                        <span className="hidden lg:block">{item.label}</span>
                    </Link>
                </div>
            ))}
    </div>
  )
}

export default Links