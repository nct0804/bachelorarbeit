import { useNavigate } from 'react-router-dom';

export default function Logo() {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate('/home');
    };

    return (
        <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
        >
            {/* <img src={logo} alt="logo" className="h-10 w-10 rounded-full" /> */}
            <p className="text-xl font-semibold justify-start p-0">GermanGains</p>
        </div>
    )
}