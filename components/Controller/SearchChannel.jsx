"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { snackbarAtom } from "@/atoms/ui";

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

  const debounceTimeout = useRef(null);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      setResults({ chzzk: [], soop: [] });
      setShowList(false);
      return;
    }
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
  }, [keyword, setSnackbar]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceTimeout.current);
      handleSearch();
    } else if (e.key === "Escape") {
      setShowList(false);
    }
  };

  useEffect(() => {
    clearTimeout(debounceTimeout.current);

    if (keyword.trim()) {
      debounceTimeout.current = setTimeout(handleSearch, 500);
    } else {
      setResults({ chzzk: [], soop: [] });
      setShowList(false);
    }

    return () => clearTimeout(debounceTimeout.current);
  }, [keyword, handleSearch]);

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
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <TextField
        fullWidth
        placeholder="채널 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{
          input: { color: "text.primary", fontSize: "1.4rem" },
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "border.primary" },
            "&:hover fieldset": { borderColor: "border.secondary" },
            "& .MuiInputAdornment-root": { marginRight: "0.4rem" }
          },
        }}
        InputProps={{
          endAdornment: loading ? (
            <CircularProgress size={20} sx={{ color: "text.quaternary" }} />
          ) : null,
        }}
      />

      <Typography
        sx={{
          fontSize: "1.2rem",
          color: "text.disabled",
          textAlign: "right",
          mt: "0.4rem",
          mr: "0.2rem",
          userSelect: "none"
        }}
      >
        {Object.keys(channels).length} / {maxChannels}
      </Typography>

      {showList && (
        <Paper
          sx={(theme) => ({
            position: "absolute",
            top: "4.8rem",
            right: 0,
            zIndex: 1000,
            overflowX: "auto",
            backgroundColor: "background.level1",
            padding: "1.0rem",
            borderRadius: "0.6rem",
            boxShadow: `.0rem 0.4rem 1.0rem ${theme.palette.background.overlay}`,
            display: "flex",
            gap: 2,
          })}
        >
          {["chzzk", "soop"].map((platform) => (
            <Box
              key={platform}
              sx={{
                width: "22.0rem",
                backgroundColor: "background.level2",
                borderRadius: "0.6rem",
                padding: "0.8rem",
              }}
            >
              <Typography sx={{ color: "text.secondary", fontSize: "1.3rem", mb: 1 }}>
                {platform.toUpperCase()}
              </Typography>

              {results[platform]?.length > 0 ? (
                results[platform].map((ch) => (
                  <Box
                    key={`${ch.platform}-${ch.id}`}
                    sx={{
                      position: "relative",
                      padding: "0.6rem 0.4rem",
                      cursor: "pointer",
                      borderRadius: "0.4rem",
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
                        backgroundColor: "background.overlay",
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                    >
                      <AddIcon sx={{ fontSize: 36, color: "text.primary" }} />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: "text.placeholder", fontSize: "1.3rem" }}>
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
