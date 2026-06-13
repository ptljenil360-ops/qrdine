import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ContainerScroll } from "../components/ui/container-scroll-animation";
import bgImage from "../../assets/remove_evrything_else_just_give_202605282246.jpeg";
import heroImage from "../../assets/generate_image_having_Warm_and_202605282150.jpeg";

export default function LandingPage() {
  return (
    <div
      className="w-full flex flex-col min-h-screen overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto z-10"
      >
        <div className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}assets/RaShoyi_logo_circle.png`} alt="RaShoyi Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex gap-4">
        </div>
      </motion.nav>

      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 w-full">
        <ContainerScroll
          titleComponent={
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2, delayChildren: 0.4 }
                }
              }}
              className="flex flex-col items-center justify-center gap-2 mb-[60px] max-w-4xl mx-auto"
            >
              <motion.h1 
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="font-heading font-[400] text-[clamp(48px,7vw,88px)] leading-[1.05] tracking-normal text-white text-center"
                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 8px 24px rgba(0,0,0,0.7), 0px 16px 40px rgba(0,0,0,0.5)' }}
              >
                Modern Restaurant Ordering <span className="italic text-[#FDBA74]" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 20px rgba(253,186,116,0.5)' }}>Made Simple</span>
              </motion.h1>
              <motion.p 
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="font-body font-[500] text-[clamp(16px,2vw,20px)] leading-[1.7] tracking-[0.01em] text-white text-center max-w-3xl mt-6"
                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 4px 12px rgba(0,0,0,0.8)' }}
              >
                Empower customers to scan, browse menus, and place orders instantly <br className="hidden md:block" />
                with RaShoyi's powerful web app.
              </motion.p>
              <motion.div 
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="mt-10 flex justify-center w-full"
              >
                <Link to="/signup" className="font-inter font-[600] text-[16px] tracking-[0.02em] inline-block text-center min-w-[190px] px-[40px] py-[14px] text-white bg-[#F97316] rounded-full hover:bg-[#EA580C] hover:-translate-y-[1px] transition-all duration-200 ease-in-out">
                  Get Started
                </Link>
              </motion.div>
            </motion.div>
          }
        >
          <img
            src={heroImage}
            alt="hero"
            className="w-full h-full object-cover object-center block"
            draggable={false}
          />
        </ContainerScroll>
      </div>

      {/* About Section */}
      <section className="w-full relative py-24 md:py-32 bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
              className="flex flex-col gap-6"
            >
              <motion.h2 
                variants={{
                  hidden: { y: 30, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="font-bricolage font-[700] text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-[-0.02em]"
              >
                Revolutionize Your <br className="hidden lg:block"/> Dining Experience
              </motion.h2>
              
              <motion.p 
                variants={{
                  hidden: { y: 30, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="font-inter font-[300] text-lg text-white/70 leading-relaxed max-w-xl"
              >
                Say goodbye to waiting for menus and flagging down waiters. With RaShoyi, 
                your smartphone becomes your personal ordering terminal. Instantly browse 
                vibrant digital menus, customize your meals, and order directly to your table 
                with a single scan.
              </motion.p>

              <motion.div 
                variants={{
                  hidden: { y: 30, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="grid grid-cols-2 gap-8 mt-4 pt-8 border-t border-white/10"
              >
                <div>
                  <div className="font-syne font-[700] text-4xl text-[#F97316] mb-2">3x</div>
                  <div className="font-inter font-[400] text-sm text-white/60">Faster Ordering Process</div>
                </div>
                <div>
                  <div className="font-syne font-[700] text-4xl text-[#F97316] mb-2">30%</div>
                  <div className="font-inter font-[400] text-sm text-white/60">Increase in Order Value</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 border border-white/10 p-8 flex flex-col justify-center items-center"
            >
              <div className="absolute inset-0 bg-black/20" />
              
              {/* Decorative elements */}
              <div className="relative z-10 w-24 h-24 mb-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              
              <h3 className="relative z-10 font-syne font-[600] text-2xl text-white text-center mb-4">
                Scan. Order. Enjoy.
              </h3>
              
              <p className="relative z-10 font-inter font-[300] text-center text-white/60 max-w-sm">
                No apps to download, no accounts to create. Just point your camera and start your culinary journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
