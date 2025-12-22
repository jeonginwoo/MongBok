import { useEffect } from "react"; // 1. useEffect 추가
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { layouts } from "@/data/layouts";

import { useAtom, useAtomValue } from "jotai";
import {
  layoutTypeAtom,
  ratioAtom,
  viewCountAtom,
  controllerExpandedAtom,
} from "@/atoms/setting";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",

  "& .MuiToggleButtonGroup-grouped": {
    padding: 0,
    width: "4.0rem",
    height: "4.0rem",
    border: "0.1rem solid rgba(211, 211, 211, 1) !important",
    borderRadius: "0.4rem !important",
    color: "rgba(211, 211, 211, 1)",

    "&.Mui-selected": {
      backgroundColor: "rgba(211, 211, 211, 1)",
      color: "rgba(0, 0, 0, 1)",
      borderColor: "rgba(211, 211, 211, 1)",
      "&:hover": {
        backgroundColor: "rgba(192, 192, 192, 1)",
      },
    },
  },
}));

export default function LayoutToggleGroup() {
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const ratio = useAtomValue(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const handleChange = (_, newType) => {
    if (newType !== null) {
      setLayoutType(newType);
      window.localStorage.setItem("layout", newType);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 입력창(input, textarea)이나 편집 가능한 영역에서는 단축키 무시
      const tagName = document.activeElement?.tagName;
      const isInput =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable;
      if (isInput) return;

      // 현재 viewCount에 해당하는 레이아웃 키 목록 가져오기
      const currentLayouts = layouts[ratio][viewCount];
      if (!currentLayouts) return;

      const layoutKeys = Object.keys(currentLayouts);
      const keyNumber = parseInt(e.key, 10);

      // 숫자키 1 ~ N 범위인지 확인
      if (
        !isNaN(keyNumber) &&
        keyNumber > 0 &&
        keyNumber <= layoutKeys.length
      ) {
        const targetIndex = keyNumber - 1;
        const targetLayout = layoutKeys[targetIndex];

        // 현재 레이아웃과 다를 경우에만 변경
        if (targetLayout !== layoutType) {
          setLayoutType(targetLayout);
          window.localStorage.setItem("layout", targetLayout);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewCount, layoutType, setLayoutType]);

  if (!layouts[ratio][viewCount]) {
    return null;
  }

  return (
    controllerExpanded &&
    viewCount !== 0 && (
      <StyledToggleButtonGroup
        value={viewCount === 0 ? null : layoutType}
        exclusive
        onChange={handleChange}
        aria-label="layout selection"
      >
        {Object.keys(layouts[ratio][viewCount]).map((key, index) => (
          <ToggleButton
            key={key}
            value={key}
            aria-label={`layout ${index + 1}`}
            sx={{ fontSize: "1.2rem" }}
          >
            {index + 1}
          </ToggleButton>
        ))}
      </StyledToggleButtonGroup>
    )
  );
}
