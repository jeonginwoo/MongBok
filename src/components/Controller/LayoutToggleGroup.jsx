import { useEffect } from "react"; // 1. useEffect 추가
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { layouts } from "@/data/layouts";

import { useAtom, useAtomValue } from "jotai";
import { layoutTypeAtom, viewCountAtom, controllerExpandedAtom } from "@/atoms/setting";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  
  "& .MuiToggleButtonGroup-grouped": {
    padding: 0,
    width: "40px",
    height: "40px",
    border: "1px solid #d3d3d3 !important",
    borderRadius: "4px !important",
    color: "#d3d3d3",
    
    "&.Mui-selected": {
      backgroundColor: "#d3d3d3",
      color: "#000",
      borderColor: "#d3d3d3",
      "&:hover": {
        backgroundColor: "#c0c0c0",
      },
    },
  },
}));

export default function LayoutToggleGroup() {
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
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
      const isInput = tagName === "INPUT" || tagName === "TEXTAREA" || document.activeElement?.isContentEditable;
      if (isInput) return;

      // 현재 viewCount에 해당하는 레이아웃 키 목록 가져오기
      const currentLayouts = layouts[viewCount];
      if (!currentLayouts) return;
      
      const layoutKeys = Object.keys(currentLayouts);
      const keyNumber = parseInt(e.key, 10);

      // 숫자키 1 ~ N 범위인지 확인
      if (!isNaN(keyNumber) && keyNumber > 0 && keyNumber <= layoutKeys.length) {
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

  if (!layouts[viewCount]) {
    return null;
  }

  return (
    controllerExpanded && viewCount !== 0 && (
      <StyledToggleButtonGroup
        value={viewCount === 0 ? null : layoutType}
        exclusive
        onChange={handleChange}
        aria-label="layout selection"
      >
        {Object.keys(layouts[viewCount]).map((key, index) => (
          <ToggleButton key={key} value={key} aria-label={`layout ${index + 1}`}>
            {index + 1}
          </ToggleButton>
        ))}
      </StyledToggleButtonGroup>
    )
  );
}
