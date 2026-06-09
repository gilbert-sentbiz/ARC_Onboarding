// Sidebar.jsx — V.2 LNB (foldable)
//
// Design tokens (Figma: Sentbiz Design System V.2 / navigation component)
//   Background:   Semantic/Primary/Heavy  →  #122666  (dark navy)
//   Default text: Semantic/Label/Disable  →  #CBD5E1
//   Active text:  Semantic/Background/Default → #FFFFFF
//   Hover bg:     Semantic/Opacity/Normal  → rgba(203,213,225,0.10)
//   Active bg:    Semantic/Opacity/Strong  → rgba(203,213,225,0.20)
//   Divider:      Semantic/Opacity/Normal  → rgba(203,213,225,0.10)
//   Border-radius: Token/Corner/Corner4   → 4px
//   Menu gap:      Token/Space/Spacing6   → 6px
//   Item padding:  Token/Space/Spacing8 / Spacing4 → 8px 4px
//
// Icons: Phosphor Icons (@phosphor-icons/react) — PascalCase component names
//   import { List, ClockCounterClockwise, File, SidebarSimple,
//            ArrowClockwise, Gear, Question, CaretDown, CaretUp } from '@phosphor-icons/react';

// NAV_ITEMS: add optional `children` array to enable submenu expansion.
// Example:
//   { key: 'transactions', iconName: 'ClockCounterClockwise', label: 'Transactions',
//     children: [
//       { key: 'tx-all',     label: 'All transactions' },
//       { key: 'tx-pending', label: 'Pending review',  iconName: 'Clock' },
//     ]},
const NAV_ITEMS = [
  { key: 'dashboard',      iconName: 'SquaresFour',     label: 'Dashboard' },
  { key: 'transactions',   iconName: 'ArrowsLeftRight', label: 'Transactions' },
  { key: 'settlements',    iconName: 'ClipboardText',   label: 'Settlements' },
  { key: 'counterparties', iconName: 'List',            label: 'Counterparties' },
  { key: 'fx',             iconName: 'Coins',           label: 'FX rates' },
];

const FOOTER_ITEMS = [
  { key: 'settings', iconName: 'Gear',     label: 'Settings' },
  { key: 'help',     iconName: 'Question', label: 'Help' },
];

// ─── MenuItem ────────────────────────────────────────────────────────────────
// state: 'default' | 'hover' | 'selected' | 'open'
const MenuItem = ({ iconName, label, isActive, isOpen, hasChildren, folded, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  const isHighlighted = isActive || isOpen;
  const bg = isHighlighted ? 'rgba(203,213,225,0.20)' : hovered ? 'rgba(203,213,225,0.10)' : 'transparent';
  const textColor  = isHighlighted ? '#FFFFFF' : '#CBD5E1';
  const fontSize   = isHighlighted ? 18 : 16;       // Subtitle2 vs Body_M1
  const fontWeight = isHighlighted ? 600 : 500;
  const lineHeight = isHighlighted ? '28px' : '24px';
  const letterSpacing = isHighlighted ? 0 : '0.5px';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center',
        gap: 6,                              // Token/Space/Spacing6
        height: 40,
        padding: '8px 4px',                  // Token/Space/Spacing8 / Spacing4
        margin: '0 8px',
        width: folded ? 'auto' : 224,
        justifyContent: folded ? 'center' : 'flex-start',
        borderRadius: 4,                     // Token/Corner/Corner4
        cursor: 'pointer', background: bg,
        position: 'relative', transition: 'background 0.15s',
      }}
    >
      {/* LeadingIcon — 28×28 wrapper around 20×20 icon */}
      <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={iconName} size={20} color={textColor} />
      </div>

      {/* Label */}
      {!folded && (
        <span style={{ fontFamily: 'Pretendard, sans-serif', fontSize, fontWeight, lineHeight, letterSpacing, color: textColor, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}

      {/* TrailingIcon — caret for expandable items */}
      {!folded && hasChildren && (
        <span style={{ position: 'absolute', right: 10, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={isOpen ? 'CaretUp' : 'CaretDown'} size={16} color={textColor} />
        </span>
      )}
    </button>
  );
};

// ─── SubmenuItem (Navigation/Submenu) ─────────────────────────────────────────
// Indented under parent MenuItem. padding-left 38px aligns label after parent's icon+gap.
const SubmenuItem = ({ label, iconName, isActive, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const textColor = isActive ? '#FFFFFF' : '#CBD5E1';
  const bg = isActive ? 'rgba(203,213,225,0.20)' : hovered ? 'rgba(203,213,225,0.10)' : 'transparent';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32,
        // 38px = 4px(btn-padding) + 28px(icon-wrapper) + 6px(gap) → aligns with parent label
        padding: '4px 8px 4px 38px',
        margin: '0 8px', width: 224,
        borderRadius: 4, cursor: 'pointer',
        background: bg, transition: 'background 0.15s',
      }}
    >
      {iconName && (
        <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={iconName} size={16} color={textColor} />
        </div>
      )}
      <span style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: '0.5px', color: textColor, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
};

// ─── IconMenuItem (Navigation/IconMenu) — folded state ───────────────────────
// 52×52 touch target, 24px icon
const IconMenuItem = ({ iconName, label, isActive, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const bg = isActive ? 'rgba(203,213,225,0.20)' : hovered ? 'rgba(203,213,225,0.10)' : 'transparent';
  const iconColor = isActive ? '#FFFFFF' : '#CBD5E1';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        all: 'unset', boxSizing: 'border-box',
        width: 52, height: 52, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, cursor: 'pointer',
        background: bg, transition: 'background 0.15s',
      }}
    >
      <Icon name={iconName} size={24} color={iconColor} />
    </button>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, onNavigate, folded, onToggleFold }) => {
  const W = folded ? 64 : 240;
  const [openItem, setOpenItem] = React.useState(null);

  // Items with children: toggle open/closed. Items without: navigate directly.
  const handleMenuClick = (key, hasChildren) => {
    if (hasChildren) {
      setOpenItem(prev => prev === key ? null : key);
    } else {
      onNavigate(key);
    }
  };

  const renderNavItem = ({ key, iconName, label, children }) => {
    const hasChildren = !!(children && children.length);
    return (
      <React.Fragment key={key}>
        {folded
          ? <IconMenuItem iconName={iconName} label={label} isActive={active === key} onClick={() => onNavigate(key)} />
          : <MenuItem iconName={iconName} label={label} isActive={active === key} isOpen={openItem === key} hasChildren={hasChildren} folded={false} onClick={() => handleMenuClick(key, hasChildren)} />
        }
        {!folded && hasChildren && openItem === key && children.map(({ key: cKey, label: cLabel, iconName: cIcon }) => (
          <SubmenuItem key={cKey} label={cLabel} iconName={cIcon} isActive={active === cKey} onClick={() => onNavigate(cKey)} />
        ))}
      </React.Fragment>
    );
  };

  return (
    <aside style={{
      width: W, flexShrink: 0, height: '100%',
      background: '#122666',                 // Semantic/Primary/Heavy
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease-in-out',
      overflow: 'hidden',
    }}>

      {/* ── Header (Navigation/Header · 240×68) ── */}
      <div style={{
        height: 68, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: folded ? 0 : '0 20px',
        justifyContent: folded ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(203,213,225,0.10)',
      }}>
        {folded
          ? <img src="../../assets/logos/logo-mark-dark-navy.svg" width="28" height="28" alt="SentBiz" />
          : <img src="../../assets/logos/wordmark-white.svg" width="92" height="20" alt="sentbiz" />
        }
      </div>

      {/* ── Nav items ── */}
      <nav style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid rgba(203,213,225,0.10)' }}>
        {FOOTER_ITEMS.map(renderNavItem)}

        {/* fold/unfold toggle */}
        <div style={{ padding: folded ? 0 : '8px 20px', display: 'flex', justifyContent: folded ? 'center' : 'flex-end', marginTop: 4 }}>
          <button
            onClick={onToggleFold}
            aria-label="Toggle sidebar"
            style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="SidebarSimple" size={20} color="#94A3B8" />
          </button>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
window.MenuItem = MenuItem;
window.SubmenuItem = SubmenuItem;
window.IconMenuItem = IconMenuItem;
