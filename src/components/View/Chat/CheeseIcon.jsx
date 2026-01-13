import { memo } from "react";
import Image from "next/image";
import cheeseIcon from "public/chzzk/cheese01.png";

function CheeseIcon() {
  return (
    <Image
      src={cheeseIcon}
      alt="Cheese"
      width={20}
      height={20}
      style={{
        verticalAlign: "top",
        padding: "0.2rem 0.4rem 0 0",
      }}
    />
  );
}

export default memo(CheeseIcon);