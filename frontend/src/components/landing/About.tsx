import founderAvatar from "../../assets/avatar.png";

function About() {
    return (
        <section id="about" className="py-10 sm:py-14 bg-gray-50" data-test="landing-about">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        About Us
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                        We are passionate about making German language learning accessible and enjoyable for everyone. Our platform offers a comprehensive curriculum, interactive lessons, and a supportive community to help you achieve your language goals.
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 mt-4">
                        We are open to contributions and collaborations. If you're interested in joining us or have any questions, feel free to reach out!
                    </p>
                     <div className="flex items-center  justify-center mt-6" data-test="landing-about-founder">
                        <img
                        src={founderAvatar}
                        alt="Chi Thien Nguyen"
                        className="w-8 h-8 rounded-full mr-2.5"
                        />
                        <div>
                    <h4 className="font-bold text-gray-900 text-xs">Chi Thien Nguyen</h4>
                        <p className="text-gray-500 text-xs">Software Engineer</p>
                        <p className="text-gray-500 text-xs">darealthien@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;