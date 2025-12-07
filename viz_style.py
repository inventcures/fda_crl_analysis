"""
Academic visualization style for FDA CRL analysis.
Muted, professional color palette that looks human-crafted, not AI-generated.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib as mpl

# Academic color palette (muted, professional)
ACADEMIC_COLORS = {
    'primary': '#2563EB',      # Muted blue
    'secondary': '#059669',    # Muted green
    'tertiary': '#D97706',     # Muted orange
    'quaternary': '#DC2626',   # Muted red
    'quinary': '#7C3AED',      # Muted purple

    # Grays for backgrounds and text
    'gray-50': '#FAFAFA',
    'gray-100': '#F5F5F5',
    'gray-200': '#E5E5E5',
    'gray-300': '#D4D4D4',
    'gray-600': '#6B6B6B',
    'gray-900': '#1A1A1A',
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
    Apply academic visualization style to all matplotlib plots.

    This removes the "AI-generated" look by using:
    - Muted, professional colors (not bright saturated defaults)
    - Clean white backgrounds (not colored backgrounds)
    - Subtle gridlines (not bold)
    - Professional fonts (Helvetica/Arial)
    - High contrast text (not gray)
    - Minimal chart junk
    """

    # Set style base
    plt.style.use('seaborn-v0_8-paper')

    # Update matplotlib rcParams for academic aesthetic
    mpl.rcParams.update({
        # Figure
        'figure.facecolor': 'white',
        'figure.edgecolor': 'white',
        'figure.dpi': 150,
        'figure.figsize': (10, 6),

        # Axes
        'axes.facecolor': 'white',
        'axes.edgecolor': ACADEMIC_COLORS['gray-200'],
        'axes.linewidth': 0.8,
        'axes.grid': True,
        'axes.grid.axis': 'y',
        'axes.axisbelow': True,
        'axes.labelcolor': ACADEMIC_COLORS['gray-900'],
        'axes.titlesize': 14,
        'axes.labelsize': 11,
        'axes.titleweight': '600',
        'axes.titlepad': 15,

        # Grid
        'grid.color': ACADEMIC_COLORS['gray-100'],
        'grid.linewidth': 0.5,
        'grid.alpha': 0.8,

        # Ticks
        'xtick.color': ACADEMIC_COLORS['gray-600'],
        'ytick.color': ACADEMIC_COLORS['gray-600'],
        'xtick.labelsize': 10,
        'ytick.labelsize': 10,
        'xtick.major.width': 0.8,
        'ytick.major.width': 0.8,
        'xtick.major.size': 4,
        'ytick.major.size': 4,

        # Legend
        'legend.frameon': True,
        'legend.framealpha': 1.0,
        'legend.facecolor': 'white',
        'legend.edgecolor': ACADEMIC_COLORS['gray-200'],
        'legend.fontsize': 10,
        'legend.title_fontsize': 11,

        # Font
        'font.family': 'sans-serif',
        'font.sans-serif': ['Helvetica', 'Arial', 'DejaVu Sans', 'Liberation Sans'],
        'font.size': 11,

        # Lines
        'lines.linewidth': 1.5,
        'lines.markersize': 6,

        # Patches (bars, etc.)
        'patch.linewidth': 0.5,
        'patch.edgecolor': ACADEMIC_COLORS['gray-200'],

        # Savefig
        'savefig.dpi': 150,
        'savefig.bbox': 'tight',
        'savefig.facecolor': 'white',
        'savefig.edgecolor': 'white',

        # Colors (use muted palette)
        'axes.prop_cycle': plt.cycler(color=COLOR_PALETTE),
    })

    # Set seaborn palette
    sns.set_palette(COLOR_PALETTE)
    sns.set_context("paper", font_scale=1.1)
    sns.set_style("whitegrid", {
        'grid.color': ACADEMIC_COLORS['gray-100'],
        'grid.linewidth': 0.5,
        'axes.edgecolor': ACADEMIC_COLORS['gray-200'],
        'axes.linewidth': 0.8,
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
    # Use seaborn to create a diverging palette from muted colors
    return sns.diverging_palette(
        220,  # Blue hue
        15,   # Orange hue
        s=60,  # Saturation (muted)
        l=60,  # Lightness (not too dark)
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
