import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import AvatarIcon from '../../assets/avatar.png'

export default function UserPanel({ user, logout }: { user: any; logout: () => Promise<void> }) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)

    const handleConfirmLogout = async () => {
        setLogoutLoading(true)
        try {
            await logout()
        } finally {
            setLogoutLoading(false)
            setShowLogoutConfirm(false)
        }
    }

    return (
        <>
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
                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="text-xs text-blue-500 hover:underline focus:outline-none cursor-pointer font-bold"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                            Confirm Logout
                        </h3>
                        <p className="mb-5 text-sm text-gray-600">
                            Do you want to log out now?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                                Continue
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLogout}
                                disabled={logoutLoading}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {logoutLoading ? 'Logging out...' : 'Log out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
