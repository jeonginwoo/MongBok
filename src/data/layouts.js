// val of layouts[1][layout1]
const a11 = 80;

// val of layouts[2][layout1]
const a21 = a11;
const b21 = 28.8;

// val of layouts[4][layout1]
const a31 = 60;

// val of layouts[4][layout1]
const a41 = 71.2;

export const layouts = {  // layouts[viewCount][layoutType][zoneType][zoneId]
  1: {
    layout1: {
      view: {
        1: { id: 1, type: "view", style: { top: `${(100 - a11) / 2}%`, left: "0%", width: `${a11}%`, height: `${a11}%` } },
      },
      chat: {
        1: { id: 1, type: "chat", style: { top: "0%", left: `${a11}%`, width: `${(100 - a11)}%`, height: "100%" } },
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
        1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${a21}%`, height: `${a21}%` } },
        2: { id: 2, type: "view", style: { top: `${(100 - b21)}%`, left: `${(100 - b21)}%`, width: `${b21}%`, height: `${b21}%`, zIndex: 1 } },
      },
      chat: {
        1: { id: 1, type: "chat", style: { top: "0%", left: `${a21}%`, width: `${(100 - a21)}%`, height: `${(100 - b21) * 5 / 8}%` } },
        2: { id: 2, type: "chat", style: { top: `${(100 - b21) * 5 / 8}%`, left: `${a21}%`, width: `${(100 - a21)}%`, height: `${(100 - b21) * 3 / 8}%` } },
      },
    },
    layout2: {
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
        1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${a31}%`, height: `${a31}%` } },
        2: { id: 2, type: "view", style: { top: `${a31}%`, left: "0%", width: `${(100 - a31)}%`, height: `${(100 - a31)}%` } },
        3: { id: 3, type: "view", style: { top: `${a31}%`, left: `${(100 - a31)}%`, width: `${(100 - a31)}%`, height: `${(100 - a31)}%` } },
      },
      chat: {
        1: { id: 1, type: "chat", style: { top: "0%", left: `${a31}%`, width: `${(100 - a31) * 2 - a31}%`, height: `${a31}%` } },
        2: { id: 2, type: "chat", style: { top: "0%", left: `${(100 - a31) * 2}%`, width: `${100 - (100 - a31) * 2}%`, height: "50%" } },
        3: { id: 3, type: "chat", style: { top: "50%", left: `${(100 - a31) * 2}%`, width: `${100 - (100 - a31) * 2}%`, height: "50%" } },
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
        2: { id: 2, type: "view", style: { top: "0%", left: "50%", width: "50%", height: "50%" } },
        3: { id: 3, type: "view", style: { top: "50%", left: "0%", width: "50%", height: "50%" } },
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
        1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${a41}%`, height: `${a41}%` } },
        2: { id: 2, type: "view", style: { top: `${a41}%`, left: "0%", width: `${(100 - a41)}%`, height: `${(100 - a41)}%` } },
        3: { id: 3, type: "view", style: { top: `${a41}%`, left: `${(100 - a41)}%`, width: `${(100 - a41)}%`, height: `${(100 - a41)}%` } },
        4: { id: 4, type: "view", style: { top: `${a41}%`, left: `${(100 - a41) * 2}%`, width: `${(100 - a41)}%`, height: `${(100 - a41)}%` } },
      },
      chat: {
        1: { id: 1, type: "chat", style: { top: "0%", left: `${a41}%`, width: `${(100 - a41) * 3 - a41}%`, height: `${a41}%` } },
        2: { id: 2, type: "chat", style: { top: "0%", left: `${(100 - a41) * 3}%`, width: `${100 - (100 - a41) * 3}%`, height: `${100 / 3}%` } },
        3: { id: 3, type: "chat", style: { top: `${100 / 3}%`, left: `${(100 - a41) * 3}%`, width: `${100 - (100 - a41) * 3}%`, height: `${100 / 3}%` } },
        4: { id: 4, type: "chat", style: { top: `${200 / 3}%`, left: `${(100 - a41) * 3}%`, width: `${100 - (100 - a41) * 3}%`, height: `${100 / 3}%` } },
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
};
