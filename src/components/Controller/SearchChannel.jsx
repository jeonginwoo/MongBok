import React, { useState, useEffect, useRef } from "react";
import { Box, TextField, Paper, CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchChannelInfo from "@/components/Info/ChannelInfo/SearchChannelInfo";
import ChannelSnackbar from "@/components/Info/ChannelSnackbar";
import { searchChannels } from "@/api/search";

export default function SearchChannel({ setChannels }) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  const [results, setResults] = useState({ chzzk: [], soop: [] });
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults({ chzzk: [], soop: [] });
      setShowList(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const platforms = ["chzzk", "soop"];
        const promises = platforms.map((p) => searchChannels(keyword, p));
        const [chzzkRes, soopRes] = await Promise.all(promises);

        setResults({ chzzk: chzzkRes, soop: soopRes });
        setShowList(true);
      } catch (e) {
        console.error("검색 실패:", e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [keyword]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const addChannel = (selectChannel) => {
    setChannels((prev) => {
      const limit = 30;
      if (Object.keys(prev).length >= limit) {
        setSnackbarMessage(`채널은 최대 ${limit}개까지 추가 가능합니다.`);
        setSnackbarOpen(true);
        return prev;
      }

      const updated = {
        ...prev,
        [selectChannel.id]: { ...selectChannel, isVisible: false, zoneId: null },
      };

      window.localStorage.setItem(
        "channels",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(updated).map(([id, ch]) => [
              id,
              { platform: ch.platform, zoneId: ch.zoneId ?? null },
            ])
          )
        )
      );

      return updated;
    });

    setKeyword("");
    setResults({ chzzk: [], soop: [] });
    setShowList(false);
  };

  return (
    <Box ref={containerRef} sx={{ mb: 2, pr: 1, position: "relative" }}>
      {/* 검색 입력창 */}
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

      {/* 로딩 스피너 */}
      {loading && (
        <Box sx={{ position: "absolute", mt: 1, textAlign: "center" }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* 검색 결과 */}
      {showList && (
        <Paper
          sx={{
            position: "absolute",
            top: "48px",
            right: 0,
            zIndex: 1000,
            overflowX: "auto",
            backgroundColor: "#2a2a2a",
            padding: "10px",
            borderRadius: "6px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.4)",
            display: "flex",
            gap: 2,
          }}
        >
          {["chzzk", "soop"].map((platform) => (
            <Box
              key={platform}
              sx={{
                width: "220px",
                backgroundColor: "#1f1f1f",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <Typography sx={{ color: "#bbb", fontSize: "14px", mb: 1 }}>
                {platform.toUpperCase()}
              </Typography>

              {results[platform]?.length > 0 ? (
                results[platform].map((ch) => (
                  <Box
                    key={`${ch.platform}-${ch.id}`}
                    sx={{
                      position: "relative",
                      padding: "6px 4px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      overflow: "hidden",
                      "&:hover .hoverOverlay": { opacity: 1 },
                      "&:hover .content": { opacity: 0.2 },
                    }}
                    onClick={() => addChannel(ch)}
                  >
                    <Box className="content" sx={{ transition: "opacity 0.2s" }}>
                      <SearchChannelInfo searchChannel={ch} />
                    </Box>
                    <Box
                      className="hoverOverlay"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        opacity: 0,
                        transition: "opacity 0.2s",
                        pointerEvents: "none",
                      }}
                    >
                      <AddIcon sx={{ fontSize: 36, color: "white" }} />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: "#777", fontSize: "13px" }}>
                  결과 없음
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      )}

      <ChannelSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

