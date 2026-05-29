import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex flex-col items-center justify-center relative p-2 md:p-20 w-full"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative flex flex-col items-center justify-center text-center"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <div className="w-full flex justify-center items-center mt-8">
          <Card rotate={rotate} translate={translate} scale={scale}>
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="flex justify-center items-center w-full mx-auto max-w-[280px] md:max-w-[360px] aspect-[9/16] border-[4px] border-[#52525b] p-2 md:p-3 bg-[#000000] rounded-[32px] md:rounded-[40px] shadow-2xl relative -mt-12"
    >
      {/* Screen Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900 rounded-[24px] md:rounded-[32px]">
        {/* Dynamic Island / Mobile Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] md:w-[120px] h-[24px] md:h-[32px] bg-[#000000] rounded-full flex justify-center items-center z-10">
            {/* Webcam dot */}
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#111] border border-[#222]"></div>
        </div>
        {children}
      </div>
    </motion.div>
  );
};
