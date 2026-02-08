import React from 'react';
import { Code2, Coffee, MessageCircle, Users, Heart, Target } from 'lucide-react';

function AboutUs() {
    return (
        <div className="flex-1 flex justify-center overflow-auto max-w-3xl mx-auto bg-white rounded-2xl px-10 py-0 shadow-lg" data-test="page-about">
            <div className="w-full">

                {/* Header */}
                <div className="text-center mt-6" data-test="about-header">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-3">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r text-[#017395] bg-clip-text">
                        About GermanGains
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg mx-auto">
                        Making German learning less painful, one lesson at a time
                    </p>
                </div>

                {/* Story Section */}
                <div className="mb-8" data-test="about-story">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r text-[#017395] bg-clip-text">
                        Our Story
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 mb-4">
                            We were frustrated with expensive, boring German learning tools.
                            As international students in Germany, we know exactly how challenging it can be.
                        </p>
                        <p className="text-gray-700">
                            So we built something better. GermanGains is our university project
                            that became something we actually care about and use ourselves.
                        </p>
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-8" data-test="about-values">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r text-[#017395] bg-clip-text">
                        What We Believe
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="bg-gradient-to-r from-orange-500 to-red-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                                <Heart className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2 text-gray-900">Always Free</h3>
                            <p className="text-sm text-gray-600">
                                Good education shouldn't cost a fortune. Everything stays free, forever.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                                <Code2 className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2 text-gray-900">Student-Built</h3>
                            <p className="text-sm text-gray-600">
                                Made by IT-students who actually use what we build.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="bg-gradient-to-r from-green-500 to-teal-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                                <Coffee className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2 text-gray-900">Real Experience</h3>
                            <p className="text-sm text-gray-600">
                                We learned German the hard way. Now making it easier for others.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mission Section */}
                <div className="mb-8" data-test="about-mission">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r text-[#017395] bg-clip-text">
                        Our Mission
                    </h2>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 text-center">
                        <Target className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                        <p className="text-gray-700 mb-4">
                            We want to build bridges between cultures by making German learning
                            accessible, interactive, and completely free.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm">
                                🚀 Always improving
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm">
                                💬 Feedback welcome
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm">
                                🎓 University project
                            </span>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-8" data-test="about-team">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r text-[#017395] bg-clip-text">
                        The Team
                    </h2>
                    <div className="rounded-lg p-6 text-center">
                        <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-700 mb-3">
                            We're computer science students at university in Germany.
                            Most of us came here not speaking much German, so we get the struggle.
                            That's basically how GermanGains started.
                        </p>
                    </div>
                </div>

                <div className="mb-8" data-test="about-metrics">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r text-[#017395] bg-clip-text">
                        Current Metrics
                    </h2>
                    <div className=" p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-purple-600">1.0</div>
                                <div className="text-xs text-gray-500">Version</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">∞</div>
                                <div className="text-xs text-gray-500">Potential</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">100%</div>
                                <div className="text-xs text-gray-500">Free</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
