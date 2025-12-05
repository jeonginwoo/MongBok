import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Paper,
  CircularProgress,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import SearchChannelInfo from "@/components/Info/ChannelInfo/SearchChannelInfo";
import { searchChannels } from "@/api/search";

import { useAtom, useSetAtom } from "jotai";
import { channelsAtom } from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/snackbar";

export default function SearchChannel() {
  const maxChannels = 30;

  const [channels, setChannels] = useAtom(channelsAtom);
  const setSnackbar = useSetAtom(snackbarAtom);

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
        setSnackbar({
          open: true,
          message: "채널 검색 중 오류가 발생했습니다.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [keyword]);

  const addChannel = (selectChannel) => {
    setChannels((prev) => {
      if (prev[selectChannel.id]) {
        setSnackbar({
          open: true,
          message: "이미 추가된 채널입니다.",
          severity: "warning",
        });
        return prev;
      }
      
      if (Object.keys(prev).length >= maxChannels) {
        setSnackbar({
          open: true,
          message: `채널은 최대 ${maxChannels}개까지 추가 가능합니다.`,
          severity: "warning",
        });
        return prev;
      }

      const updated = {
        ...prev,
        [selectChannel.id]: {
          ...selectChannel,
          isVisible: false,
          zoneId: null,
        },
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
    <Box ref={containerRef} sx={{ mb: 2, position: "relative" }}>
      <TextField
        fullWidth
        placeholder="채널 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        sx={{
          input: { color: "white" },
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#555" },
            "&:hover fieldset": { borderColor: "#888" },
            "& .MuiInputAdornment-root": { marginRight: "4px" }
          },
        }}
        InputProps={{
          endAdornment: loading ? (
            <CircularProgress size={20} sx={{ color: "#aaa" }} />
          ) : null,
        }}
      />

      <Typography
        sx={{
          fontSize: "12px",
          color: "#888",
          textAlign: "right",
          mt: "4px",
          mr: "2px",
          userSelect: "none"
        }}
      >
        {Object.keys(channels).length} / {maxChannels}
      </Typography>

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
                    <Box
                      className="content"
                      sx={{ transition: "opacity 0.2s" }}
                    >
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
    </Box>
  );
}
