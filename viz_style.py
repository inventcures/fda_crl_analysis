"""
Premium visualization style for FDA CRL analysis.
Matches the website's clean, human-centric aesthetic.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib as mpl

# Premium color palette (matches website)
ACADEMIC_COLORS = {
    'primary': '#3B82F6',      # Blue-500
    'secondary': '#F59E0B',    # Amber-500
    'tertiary': '#10B981',     # Emerald-500
    'quaternary': '#8B5CF6',   # Violet-500
    'quinary': '#EC4899',      # Pink-500

    # Grays for backgrounds and text
    'gray-50': '#F8FAFC',      # Slate-50
    'gray-100': '#F1F5F9',     # Slate-100
    'gray-200': '#E2E8F0',     # Slate-200
    'gray-300': '#CBD5E1',     # Slate-300
    'gray-600': '#475569',     # Slate-600
    'gray-900': '#031863',     # Deep Navy (Text Primary)
    'heading': '#2B2B2B',      # Dark Gray (Headings)
}

# Color list for cyclic use
COLOR_PALETTE = [
    ACADEMIC_COLORS['primary'],
    ACADEMIC_COLORS['secondary'],
    ACADEMIC_COLORS['tertiary'],
    ACADEMIC_COLORS['quaternary'],
    ACADEMIC_COLORS['quinary'],
]


def apply_academic_style():
    """
    Apply premium visualization style to all matplotlib plots.
    
    Features:
    - Monospace fonts for titles (matches website headings)
    - Clean sans-serif for labels
    - High-contrast, sophisticated color palette
    - Minimalist grid and chrome
    """

    # Set style base
    plt.style.use('seaborn-v0_8-paper')

    # Update matplotlib rcParams for premium aesthetic
    mpl.rcParams.update({
        # Figure
        'figure.facecolor': 'white',
        'figure.edgecolor': 'white',
        'figure.dpi': 150,
        'figure.figsize': (10, 6),

        # Axes
        'axes.facecolor': 'white',
        'axes.edgecolor': ACADEMIC_COLORS['gray-200'],
        'axes.linewidth': 1.0,
        'axes.grid': True,
        'axes.grid.axis': 'y',
        'axes.axisbelow': True,
        'axes.labelcolor': ACADEMIC_COLORS['gray-600'],
        'axes.titlesize': 16,
        'axes.labelsize': 12,
        'axes.titleweight': 'normal', # Monospace looks better normal
        'axes.titlepad': 20,
        'axes.titlecolor': ACADEMIC_COLORS['heading'],

        # Grid
        'grid.color': ACADEMIC_COLORS['gray-100'],
        'grid.linewidth': 1.0,
        'grid.alpha': 1.0, # Solid but light lines

        # Ticks
        'xtick.color': ACADEMIC_COLORS['gray-600'],
        'ytick.color': ACADEMIC_COLORS['gray-600'],
        'xtick.labelsize': 11,
        'ytick.labelsize': 11,
        'xtick.major.width': 1.0,
        'ytick.major.width': 1.0,
        'xtick.major.size': 6,
        'ytick.major.size': 6,

        # Legend
        'legend.frameon': False, # Cleaner without frame
        'legend.fontsize': 11,
        'legend.title_fontsize': 12,

        # Font
        # Prefer monospace for that "technical/lab" feel
        'font.family': 'monospace',
        'font.monospace': ['Ubuntu Mono', 'Consolas', 'Monaco', 'Andale Mono', 'monospace'],
        'font.sans-serif': ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
        'font.size': 12,

        # Lines
        'lines.linewidth': 2.0,
        'lines.markersize': 8,

        # Patches (bars, etc.)
        'patch.linewidth': 0, # Cleaner bars without borders
        'patch.edgecolor': 'none',

        # Savefig
        'savefig.dpi': 300,
        'savefig.bbox': 'tight',
        'savefig.facecolor': 'white',
        'savefig.edgecolor': 'white',

        # Colors (use muted palette)
        'axes.prop_cycle': plt.cycler(color=COLOR_PALETTE),
    })

    # Set seaborn palette
    sns.set_palette(COLOR_PALETTE)
    sns.set_context("paper", font_scale=1.2)
    sns.set_style("whitegrid", {
        'grid.color': ACADEMIC_COLORS['gray-100'],
        'grid.linewidth': 1.0,
        'axes.edgecolor': ACADEMIC_COLORS['gray-200'],
        'axes.linewidth': 1.0,
        'font.family': 'monospace', # Ensure seaborn picks this up
    })


def get_color(name: str) -> str:
    """Get a color from the academic palette by name."""
    return ACADEMIC_COLORS.get(name, ACADEMIC_COLORS['gray-600'])


def get_palette(n_colors: int = None) -> list:
    """
    Get the academic color palette.

    Args:
        n_colors: Number of colors needed. If None, returns all 5.
                 If more than 5, cycles through the palette.

    Returns:
        List of hex color codes
    """
    if n_colors is None:
        return COLOR_PALETTE.copy()

    if n_colors <= len(COLOR_PALETTE):
        return COLOR_PALETTE[:n_colors]

    # Cycle through palette if more colors needed
    return [COLOR_PALETTE[i % len(COLOR_PALETTE)] for i in range(n_colors)]


def get_diverging_palette(n_colors: int = 11) -> list:
    """
    Get a diverging color palette for heatmaps.

    Args:
        n_colors: Number of colors in the diverging palette

    Returns:
        List of hex color codes
    """
    # Use seaborn to create a diverging palette
    # Blue to Amber (Cool to Warm)
    return sns.diverging_palette(
        250,  # Blue hue
        30,   # Amber hue
        s=90,  # Higher saturation
        l=60,  # Medium lightness
        n=n_colors,
        center='light'
    ).as_hex()


def get_sequential_palette(color_name: str = 'primary', n_colors: int = 9) -> list:
    """
    Get a sequential color palette for gradient visualizations.

    Args:
        color_name: Base color from ACADEMIC_COLORS (primary, secondary, etc.)
        n_colors: Number of shades in the sequential palette

    Returns:
        List of hex color codes
    """
    base_color = ACADEMIC_COLORS.get(color_name, ACADEMIC_COLORS['primary'])
    return sns.light_palette(base_color, n_colors=n_colors).as_hex()


# Apply style on import
apply_academic_style()
