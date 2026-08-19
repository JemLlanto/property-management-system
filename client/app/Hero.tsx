import Image from "next/image";
import Logo from "@/public/LOGO.png";
import BG from "@/public/bg.jpg";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Props {
  web_data: {
    hero_head_line: string;
    hero_sub_head_line: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut" as const,
    },
  },
};

export default function Hero({ web_data }: Props) {
  return (
    <div className="relative h-dvh snap-center flex justify-start items-center px-30">
      <div className="absolute inset-0 z-[-1]">
        <Image src={BG} alt="Background" fill className="object-cover" />

        <div className="absolute inset-0 bg-linear-to-r from-(--background) to-(--background)/5" />
      </div>

      <motion.div
        className="w-150"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false }}
      >
        <motion.h1
          className="font-bold text-(--foreground)"
          variants={itemVariants}
        >
          {web_data.hero_head_line}
        </motion.h1>
        <motion.h5 className="text-(--foreground)/75" variants={itemVariants}>
          {web_data.hero_sub_head_line}
        </motion.h5>
        <motion.div className="w-full mt-3" variants={itemVariants}>
          <button className="w-full bg-(--primary) hover:bg-(--primary_hover) rounded-md shadow-md text-neutral-50 flex justify-center items-center gap-5 transition duration-300 ease-in-out p-2 px-5 cursor-pointer">
            <h4>Call to Action</h4>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
