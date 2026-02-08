import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import AvatarIcon from '../../assets/avatar.png'

export default function UserPanel({ user, logout }: { user: any; logout: () => void }) {
    return (
        <div className="w-full bg-[#fefbe8] rounded-lg p-4 flex justify-around items-center">
            <div className="flex flex-col space-y-2">
                <div className="font-semibold text-gray-800">{user.name}</div>
                <div className="text-xs text-yellow-500 font-bold">Level {user.level}</div>
                <div className="flex space-x-3 text-sm mt-1">
                    <span>🔥 {user.fireCount}</span>
                    <span>🥨 {user.brezelCount}</span>
                    <span className="flex items-center">
                        <Heart size={14} className="text-pink-500 mr-1" /> {user.heartCount}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center space-y-1">
                <Link to="/profile">
                    <img
                        src={user.avatarUrl || AvatarIcon}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:border-2 "
                    />
                </Link>
                <Link to="/">
                    <button
                        onClick={() => logout()}
                        className="text-xs text-blue-500 hover:underline focus:outline-none cursor-pointer font-bold"
                    >
                        Logout
                    </button>
                </Link>
            </div>
        </div>
    )
}
