import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { layouts } from "@/data/layouts";

import { useAtom, useAtomValue } from 'jotai';
import { layoutTypeAtom, viewCountAtom } from '@/atoms/setting';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  "& .MuiToggleButton-root": {
    flex: 1,
    color: "#d3d3d3",
    border: "1px solid #d3d3d3",
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
  const viewCount = useAtomValue(viewCountAtom); // viewCount는 읽기 전용

  const handleChange = (_, newType) => {
    if (newType !== null) {
      setLayoutType(newType);
      window.localStorage.setItem("layout", newType);
    }
  };

  if (!layouts[viewCount]) {
    return null;
  }

  return (
    <StyledToggleButtonGroup
      value={viewCount === 0 ? null : layoutType}
      exclusive
      onChange={handleChange}
      aria-label="layout selection"
      fullWidth
    >
      {Object.keys(layouts[viewCount]).map((key, index) => (
        <ToggleButton key={key} value={key} aria-label={`layout ${index + 1}`}>
          layout{index + 1}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
}