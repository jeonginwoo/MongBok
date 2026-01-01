// view ratio
const ratio1 = (22 / 9) / (16 / 9);
const ratio2 = (16 / 9) / (16 / 9);
const ratio3 = (16 / 10) / (16 / 9);
const ratio4 = (10 / 16) / (16 / 9);
const ratio5 = (9 / 16) / (16 / 9);
const ratio6 = (9 / 22) / (16 / 9);

// ##################
// #     ratio1     #
// ##################
// val of canvas[ratio2].layouts[1][layout1]
const r1a11 = 100;

// val of canvas[ratio2].layouts[2][layout1]
const r1a21 = r1a11;
const r1b21 = 28.8;

// val of canvas[ratio2].layouts[3][layout1]
const r1a31 = 60;

// val of canvas[ratio2].layouts[4][layout1]
const r1a41 = 71.2;

// ##################
// #     ratio2     #
// ##################
// val of canvas[ratio2].layouts[1][layout1]
const r2a11 = 84;

// val of canvas[ratio2].layouts[2][layout1]
const r2a21 = r2a11;
const r2b21 = 28.8;

// val of canvas[ratio2].layouts[3][layout1]
const r2a31 = 60;

// val of canvas[ratio2].layouts[4][layout1]
const r2a41 = 71.2;

// ##################
// #     ratio3     #
// ##################
// val of canvas[ratio3].layouts[1][layout1]
const r3a11 = 84;

// val of canvas[ratio3].layouts[2][layout1]
const r3a21 = r2a11;
const r3b21 = 28.8;

// val of canvas[ratio3].layouts[3][layout1]
const r3a31 = 69;

// val of canvas[ratio3].layouts[4][layout1]
const r3a41 = 71.2;

export const canvas = {  // canvas[ratio].layouts[viewCount][layoutType][zoneType][zoneId]
  "ratio1": {
    maxViewCount: 1,
    style: {
      aspectRatio: "22 / 9",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r1a11 / ratio1}%`, height: `${r1a11}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r1a11 / ratio1}%`, width: `${(100 - r1a11 / ratio1)}%`, height: "100%" } },
          },
        },
      },
    },
  },
  "ratio2": {
    maxViewCount: 4,
    style: {
      aspectRatio: "16 / 9",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: `${(100 - r2a11) / 2}%`, left: "0%", width: `${r2a11}%`, height: `${r2a11}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r2a11}%`, width: `${(100 - r2a11)}%`, height: "100%" } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "100%", height: "100%" } },
          },
        },
      },
      2: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r2a21}%`, height: `${r2a21}%` } },
            2: { id: 2, type: "view", style: { top: `${(100 - r2b21)}%`, left: `${(100 - r2b21)}%`, width: `${r2b21}%`, height: `${r2b21}%`, zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r2a21}%`, width: `${(100 - r2a21)}%`, height: `${(100 - r2b21) * 5 / 8}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 - r2b21) * 5 / 8}%`, left: `${r2a21}%`, width: `${(100 - r2a21)}%`, height: `${(100 - r2b21) * 3 / 8}%` } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: `${(100 - r2a21)}%`, width: `${r2a21}%`, height: `${r2a21}%` } },
            2: { id: 2, type: "view", style: { top: `${(100 - r2b21)}%`, left: "0%", width: `${r2b21}%`, height: `${r2b21}%`, zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: "0%", width: `${(100 - r2a21)}%`, height: `${(100 - r2b21) * 5 / 8}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 - r2b21) * 5 / 8}%`, left: "0%", width: `${(100 - r2a21)}%`, height: `${(100 - r2b21) * 3 / 8}%` } },
          },
        },
        layout3: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "50%", height: "50%" } },
            2: { id: 2, type: "view", style: { top: "0%", left: "50%", width: "50%", height: "50%" } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "50%", left: "0%", width: "50%", height: "50%" } },
            2: { id: 2, type: "chat", style: { top: "50%", left: "50%", width: "50%", height: "50%" } },
          },
        },
      },
      3: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r2a31}%`, height: `${r2a31}%` } },
            2: { id: 2, type: "view", style: { top: `${r2a31}%`, left: "0%", width: `${(100 - r2a31)}%`, height: `${(100 - r2a31)}%` } },
            3: { id: 3, type: "view", style: { top: `${r2a31}%`, left: `${(100 - r2a31)}%`, width: `${(100 - r2a31)}%`, height: `${(100 - r2a31)}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r2a31}%`, width: `${(100 - r2a31) * 2 - r2a31}%`, height: `${r2a31}%` } },
            2: { id: 2, type: "chat", style: { top: "0%", left: `${(100 - r2a31) * 2}%`, width: `${100 - (100 - r2a31) * 2}%`, height: "50%" } },
            3: { id: 3, type: "chat", style: { top: "50%", left: `${(100 - r2a31) * 2}%`, width: `${100 - (100 - r2a31) * 2}%`, height: "50%" } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
            2: { id: 2, type: "view", style: { top: "0%", left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
            3: { id: 3, type: "view", style: { top: "0%", left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${(100 / 3)}%`, left: "0%", width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 / 3)}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
            3: { id: 3, type: "chat", style: { top: `${(100 / 3)}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
          },
        },
        layout3: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "50%", height: "50%" } },
            2: { id: 2, type: "view", style: { top: "50%", left: "0%", width: "50%", height: "50%", zIndex: 1 } },
            3: { id: 3, type: "view", style: { top: "50%", left: "50%", width: "50%", height: "50%", zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: "50%", width: `${(50 / 3)}%`, height: "50%" } },
            2: { id: 2, type: "chat", style: { top: "0%", left: `${50 + (50 / 3)}%`, width: `${(50 / 3)}%`, height: "50%" } },
            3: { id: 3, type: "chat", style: { top: "0%", left: `${50 + (50 / 3) * 2}%`, width: `${(50 / 3)}%`, height: "50%" } },
          },
        },
        layout4: {
          view: {
            1: { id: 1, type: "view", style: { top: "50%", left: "0%", width: "50%", height: "50%" } },
            2: { id: 2, type: "view", style: { top: "0%", left: "0%", width: "50%", height: "50%", zIndex: 1 } },
            3: { id: 3, type: "view", style: { top: "0%", left: "50%", width: "50%", height: "50%", zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "50%", left: "50%", width: `${(50 / 3)}%`, height: "50%" } },
            2: { id: 2, type: "chat", style: { top: "50%", left: `${50 + (50 / 3)}%`, width: `${(50 / 3)}%`, height: "50%" } },
            3: { id: 3, type: "chat", style: { top: "50%", left: `${50 + (50 / 3) * 2}%`, width: `${(50 / 3)}%`, height: "50%" } },
          },
        },
      },
      4: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r2a41}%`, height: `${r2a41}%` } },
            2: { id: 2, type: "view", style: { top: `${r2a41}%`, left: "0%", width: `${(100 - r2a41)}%`, height: `${(100 - r2a41)}%` } },
            3: { id: 3, type: "view", style: { top: `${r2a41}%`, left: `${(100 - r2a41)}%`, width: `${(100 - r2a41)}%`, height: `${(100 - r2a41)}%` } },
            4: { id: 4, type: "view", style: { top: `${r2a41}%`, left: `${(100 - r2a41) * 2}%`, width: `${(100 - r2a41)}%`, height: `${(100 - r2a41)}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r2a41}%`, width: `${(100 - r2a41) * 3 - r2a41}%`, height: `${r2a41}%` } },
            2: { id: 2, type: "chat", style: { top: "0%", left: `${(100 - r2a41) * 3}%`, width: `${100 - (100 - r2a41) * 3}%`, height: `${100 / 3}%` } },
            3: { id: 3, type: "chat", style: { top: `${100 / 3}%`, left: `${(100 - r2a41) * 3}%`, width: `${100 - (100 - r2a41) * 3}%`, height: `${100 / 3}%` } },
            4: { id: 4, type: "chat", style: { top: `${200 / 3}%`, left: `${(100 - r2a41) * 3}%`, width: `${100 - (100 - r2a41) * 3}%`, height: `${100 / 3}%` } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "25%", height: "25%" } },
            2: { id: 2, type: "view", style: { top: "0%", left: "25%", width: "25%", height: "25%" } },
            3: { id: 3, type: "view", style: { top: "0%", left: "50%", width: "25%", height: "25%" } },
            4: { id: 4, type: "view", style: { top: "0%", left: "75%", width: "25%", height: "25%" } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "25%", left: "0%", width: "25%", height: "75%" } },
            2: { id: 2, type: "chat", style: { top: "25%", left: "25%", width: "25%", height: "75%" } },
            3: { id: 3, type: "chat", style: { top: "25%", left: "50%", width: "25%", height: "75%" } },
            4: { id: 4, type: "chat", style: { top: "25%", left: "75%", width: "25%", height: "75%" } },
          },
        },
        layout3: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "50%", height: "50%" } },
            2: { id: 2, type: "view", style: { top: "0%", left: "50%", width: "50%", height: "50%" } },
            3: { id: 3, type: "view", style: { top: "50%", left: "0%", width: "50%", height: "50%" } },
            4: { id: 4, type: "view", style: { top: "50%", left: "50%", width: "50%", height: "50%" } },
          },
        },
      },
    },
  },
  "ratio3": {
    maxViewCount: 4,
    style: {
      aspectRatio: "16 / 10",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: `${(100 - r2a11 * ratio3) / 2}%`, left: "0%", width: `${r2a11}%`, height: `${r2a11 * ratio3}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r2a11}%`, width: `${(100 - r2a11)}%`, height: "100%" } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: `${(100 - 100 * ratio3) / 2}%`, left: "0%", width: "100%", height: `${100 * ratio3}%` } },
          },
        },
      },
      2: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r3a21}%`, height: `${r3a21 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: `${(100 - r3b21 * ratio3)}%`, left: `${(100 - r3b21)}%`, width: `${r3b21}%`, height: `${r3b21 * ratio3}%`, zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r3a21}%`, width: `${(100 - r3a21)}%`, height: `${((100 - r3b21 * ratio3) * 5 / 8)}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 - r3b21 * ratio3) * 5 / 8}%`, left: `${r3a21}%`, width: `${(100 - r3a21)}%`, height: `${((100 - r3b21 * ratio3) * 3 / 8)}%` } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: `${(100 - r3a21)}%`, width: `${r3a21}%`, height: `${r3a21 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: `${(100 - r3b21 * ratio3)}%`, left: "0%", width: `${r3b21}%`, height: `${r3b21 * ratio3}%`, zIndex: 1 } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: "0%", width: `${(100 - r3a21)}%`, height: `${(100 - r3b21 * ratio3) * 5 / 8}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 - r3b21 * ratio3) * 5 / 8}%`, left: "0%", width: `${(100 - r3a21)}%`, height: `${((100 - r3b21 * ratio3) * 3 / 8)}%` } },
          },
        },
        layout3: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "50%", height: `${50 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: "0%", left: "50%", width: "50%", height: `${50 * ratio3}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${50 * ratio3}%`, left: "0%", width: "50%", height: `${100 - 50 * ratio3}%` } },
            2: { id: 2, type: "chat", style: { top: `${50 * ratio3}%`, left: "50%", width: "50%", height: `${100 - 50 * ratio3}%` } },
          },
        },
      },
      3: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${r3a31}%`, height: `${r3a31 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: `${r3a31 * ratio3}%`, left: "0%", width: `${(100 - r3a31 * ratio3) / ratio3}%`, height: `${(100 - r3a31 * ratio3)}%` } },
            3: { id: 3, type: "view", style: { top: `${r3a31 * ratio3}%`, left: `${(100 - r3a31 * ratio3) / ratio3}%`, width: `${(100 - r3a31 * ratio3) / ratio3}%`, height: `${(100 - r3a31 * ratio3)}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${r3a31}%`, width: `${((100 - r3a31 * ratio3) / ratio3) * 2 - r3a31}%`, height: `${r3a31 * ratio3}%` } },
            2: { id: 2, type: "chat", style: { top: "0%", left: `${((100 - r3a31 * ratio3) / ratio3) * 2}%`, width: `${100 - ((100 - r3a31 * ratio3) / ratio3) * 2}%`, height: `${50}%` } },
            3: { id: 3, type: "chat", style: { top: "50%", left: `${((100 - r3a31 * ratio3) / ratio3) * 2}%`, width: `${100 - ((100 - r3a31 * ratio3) / ratio3) * 2}%`, height: `${50}%` } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: "0%", left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
            3: { id: 3, type: "view", style: { top: "0%", left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${(100 / 3) * ratio3}%`, left: "0%", width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * ratio3)}%` } },
            2: { id: 2, type: "chat", style: { top: `${(100 / 3) * ratio3}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * ratio3)}%` } },
            3: { id: 3, type: "chat", style: { top: `${(100 / 3) * ratio3}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * ratio3)}%` } },
          },
        },
      },
      4: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${(100 - (100 / 3) * ratio3) / ratio3}%`, height: `${100 - (100 / 3) * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: `${100 - (100 / 3) * ratio3}%`, left: "0%", width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
            3: { id: 3, type: "view", style: { top: `${100 - (100 / 3) * ratio3}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
            4: { id: 4, type: "view", style: { top: `${100 - (100 / 3) * ratio3}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * ratio3}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: "0%", left: `${(100 - (100 / 3) * ratio3) / ratio3}%`, width: `${(100 - (100 - (100 / 3) * ratio3) / ratio3)}%`, height: `${100 - (100 / 3) * ratio3}%` } },
          },
        },
        layout2: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "25%", height: `${25 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: "0%", left: "25%", width: "25%", height: `${25 * ratio3}%` } },
            3: { id: 3, type: "view", style: { top: "0%", left: "50%", width: "25%", height: `${25 * ratio3}%` } },
            4: { id: 4, type: "view", style: { top: "0%", left: "75%", width: "25%", height: `${25 * ratio3}%` } },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${25 * ratio3}%`, left: "0%", width: "25%", height: `${100 - (25 * ratio3)}%` } },
            2: { id: 2, type: "chat", style: { top: `${25 * ratio3}%`, left: "25%", width: "25%", height: `${100 - (25 * ratio3)}%` } },
            3: { id: 3, type: "chat", style: { top: `${25 * ratio3}%`, left: "50%", width: "25%", height: `${100 - (25 * ratio3)}%` } },
            4: { id: 4, type: "chat", style: { top: `${25 * ratio3}%`, left: "75%", width: "25%", height: `${100 - (25 * ratio3)}%` } },
          },
        },
        layout3: {
          view: {
            1: { id: 1, type: "view", style: { top: `${50 - 50 * ratio3}%`, left: "0%", width: "50%", height: `${50 * ratio3}%` } },
            2: { id: 2, type: "view", style: { top: `${50 - 50 * ratio3}%`, left: "50%", width: "50%", height: `${50 * ratio3}%` } },
            3: { id: 3, type: "view", style: { top: "50%", left: "0%", width: "50%", height: `${50 * ratio3}%` } },
            4: { id: 4, type: "view", style: { top: "50%", left: "50%", width: "50%", height: `${50 * ratio3}%` } },
          },
        },
      },
    },
  },
  "ratio4": {
    maxViewCount: 1,
    style: {
      aspectRatio: "10 / 16",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "100%", height: `${100 * ratio4}%`} },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${100 * ratio4}%`, left: "0%", width: "100%", height: `${100 - 100 * ratio4}%` } },
          },
        },
      },
    },
  },
  "ratio5": {
    maxViewCount: 1,
    style: {
      aspectRatio: "9 / 16",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "100%", height: `${100 * ratio5}%`} },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${100 * ratio5}%`, left: "0%", width: "100%", height: `${100 - 100 * ratio5}%` } },
          },
        },
      },
    },
  },
  "ratio6": {
    maxViewCount: 1,
    style: {
      aspectRatio: "9 / 22",
    },
    layouts: {
      1: {
        layout1: {
          view: {
            1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "100%", height: `${100 * ratio6}%`} },
          },
          chat: {
            1: { id: 1, type: "chat", style: { top: `${100 * ratio6}%`, left: "0%", width: "100%", height: `${100 - 100 * ratio6}%` } },
          },
        },
      },
    },
  },
};