import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
// import { LoginModal } from '../login/LoginModal'
import UserPanel from './UserPanel'

export default function HeaderPanel() {
  const [showModal, setShowModal] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const { user, logout } = useAuth()

  if (!user) {
    // Chưa đăng nhập
    return (
      <div className="w-full bg-[#fefbe8] rounded-lg p-4 space-y-4 flex flex-col items-center">
        <h2 className="text-center text-sm font-semibold text-gray-700">
          Create a profile to save your progress!
        </h2>

        <button
          onClick={() => {
            setIsSignup(true)
            setShowModal(true)
          }}
          className="w-[60%] px-4 py-2 rounded-full bg-[#FFB124] text-white font-semibold hover:bg-yellow-500 cursor-pointer"
        >
          REGISTER
        </button>

        <button
          onClick={() => {
            setIsSignup(false)
            setShowModal(true)
          }}
          className="w-[60%] px-4 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 cursor-pointer"
        >
          LOGIN
        </button>

        {/* {showModal && (
          <LoginModal
            isSignup={isSignup}
            onClose={() => setShowModal(false)}
          />
        )} */}
      </div>

    )
  }

  // Đã đăng nhập → render UserPanel
  return <UserPanel user={user} logout={logout} />
}
