import React, { useState, useEffect, useRef } from "react";
import { Box, TextField, Paper, CircularProgress } from "@mui/material";
import SearchChannelInfo from "@/components/Info/ChannelInfo/SearchChannelInfo";
import { searchAllPlatforms } from "@/api/search";

export default function SearchChannel({ setChannels }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false); // 🔹 검색 리스트 표시 여부

  const containerRef = useRef(null);

  // 🔹 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 0.5초 디바운스 검색
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setShowList(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await searchAllPlatforms(keyword);
        setResults(list);
        setShowList(true); // 검색 성공 → 리스트 열기
      } catch (e) {
        console.error("검색 실패:", e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [keyword]);

  const addChannel = async (selectChannel) => {
    try {
      setChannels((prev) => ({
        ...prev,
        [selectChannel.id]: {
          ...selectChannel,
          isVisible: false,
          zoneId: null,
        },
      }));

      // 🔹 선택 후 검색창 초기화 + 리스트 닫기
      setKeyword("");
      setResults([]);
      setShowList(false);

    } catch (err) {
      console.error(`⚠️ ${selectChannel.id} 채널 추가 실패:`, err);
    }
  };

  return (
    <Box ref={containerRef} sx={{ mb: 2, pr: 1, position: "relative" }}>
      {/* 🔹 검색 입력창 */}
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="채널 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        sx={{
          input: { color: "white" },
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#555" },
            "&:hover fieldset": { borderColor: "#888" },
          },
        }}
      />

      {/* 🔹 로딩 스피너 */}
      {loading && (
        <Box sx={{ position: "absolute", mt: 1, textAlign: "center" }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* 🔹 검색 결과 리스트 */}
      {showList && results.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            top: "48px",
            left: 0,
            right: 0,
            zIndex: 1000,
            overflowY: "auto",
            backgroundColor: "#2a2a2a",
            padding: "6px",
            borderRadius: "6px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.4)",
          }}
        >
          {results.map((selectChannel) => (
            <Box
              key={`${selectChannel.platform}-${selectChannel.id}`}
              sx={{
                padding: "6px 4px",
                cursor: "pointer",
                borderRadius: "4px",
                "&:hover": { backgroundColor: "#3a3a3a" },
              }}
              onClick={() => addChannel(selectChannel)}
            >
              <SearchChannelInfo searchChannel={selectChannel} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
