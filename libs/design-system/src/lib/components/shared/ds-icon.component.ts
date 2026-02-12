import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  // Layout & Navigation
  LayoutDashboard, Home, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ExternalLink, MoreHorizontal,
  // Actions
  Plus, Minus, X, Check, Search, Filter, Settings, Edit, Trash2, Copy,
  Download, Upload, Share2, Send, RefreshCw, RotateCcw, Save, Archive,
  Scissors, SquarePen, WandSparkles,
  // Communication
  Mail, MessageSquare, MessageCircle, Phone, Bell, BellOff, BellRing, Inbox,
  Megaphone, AtSign,
  // Content & Media
  File, FileText, Image, Video, Music, Folder, FolderOpen, Bookmark,
  Newspaper, ClipboardList, ListOrdered, ScrollText,
  // Data & Charts
  BarChart2, PieChart, TrendingUp, TrendingDown, Activity, Zap, Database,
  Percent, Gauge,
  // Users & Social
  User, Users, UserPlus, UserCheck, Heart, HeartPulse, ThumbsUp, ThumbsDown, Star,
  Github, Globe, Link,
  // Status & Feedback
  AlertCircle, AlertTriangle, Info, HelpCircle, CheckCircle, XCircle,
  CircleAlert, CircleCheck, CircleX,
  Clock, Timer, Loader, ShieldCheck, ShieldAlert,
  // Shapes
  Circle, CircleDot, Square, Triangle, Hexagon,
  // Objects & Misc
  Calendar, MapPin, Tag, Hash, Lock, Unlock, Key, Eye, EyeOff,
  Sparkles, Lightbulb, Rocket, Target, Flag, Award, Gift,
  BookOpen, Cpu, Code, Terminal, Layers, Package, Box,
  Wifi, Cloud, CloudOff, CloudRain, CloudSnow, CloudSun, Sun, Moon,
  Compass, Umbrella,
  // Weather & Nature
  Wind, Thermometer, Droplets, Droplet, Waves, Flame, Snowflake,
  Mountain, TreePine, Leaf, Sprout, Apple,
  // Finance
  DollarSign, CreditCard, Wallet, Banknote, Coins, PiggyBank,
  // Buildings & Places
  Landmark, Building, Building2, School, Hospital, Factory, Warehouse, Store,
  // Transport
  Car, Plane, Ship, Bike, Bus, Truck,
  // Tools
  Hammer, Wrench, Plug, Power,
  // Tech & Devices
  Monitor, Smartphone, Tablet, Laptop, Keyboard, Mouse, Gamepad,
  Battery, BatteryCharging, Bluetooth, Volume, VolumeX,
  Headphones, Speaker, Tv, Radio,
  // Media controls
  SkipForward, SkipBack, Repeat, Shuffle, Maximize, Minimize, Fullscreen,
  // Science
  Brain, Atom,
  // Commerce
  ShoppingCart, ShoppingBag,
  // Food & Drink
  Coffee, GlassWater,
  // Misc
  Grip, Palette, Paintbrush, Mic, Camera, Printer, Watch, Joystick,
  type LucideIconData,
} from 'lucide-angular';

/**
 * DS Icon component — renders a Lucide icon from a kebab-case string name,
 * OR an emoji character when the value is a Unicode emoji.
 *
 * Usage:
 *   <ds-icon name="alert-circle" [size]="16"></ds-icon>   <!-- Lucide -->
 *   <ds-icon name="🚀" [size]="16"></ds-icon>             <!-- Emoji  -->
 *
 * Supports ~200 commonly-used Lucide icons.
 * Unknown non-emoji names fall back to a generic "circle" icon.
 */
@Component({
  selector: 'ds-icon',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lucide-icon
      *ngIf="resolvedIcon"
      [img]="resolvedIcon"
      [size]="size"
      [strokeWidth]="strokeWidth"
    ></lucide-icon>
    <span
      *ngIf="emoji"
      class="ds-emoji"
      [style.font-size.px]="size"
      [style.line-height.px]="size"
      role="img"
      [attr.aria-label]="emoji"
    >{{ emoji }}</span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .ds-emoji {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
      line-height: 1;
    }
  `],
})
export class DsIconComponent {
  @Input() set name(val: string) {
    if (!val) {
      this.resolvedIcon = null;
      this.emoji = null;
      return;
    }
    // Try Lucide icon first
    const icon = ICON_MAP[val];
    if (icon) {
      this.resolvedIcon = icon;
      this.emoji = null;
      return;
    }
    // Check if it's an emoji (starts with emoji codepoint)
    if (isEmoji(val)) {
      this.emoji = val;
      this.resolvedIcon = null;
      return;
    }
    // Unknown icon name — fall back to Circle so something always renders
    this.resolvedIcon = ICON_MAP['circle'];
    this.emoji = null;
  }
  @Input() size = 16;
  @Input() strokeWidth = 1.75;

  resolvedIcon: LucideIconData | null = null;
  emoji: string | null = null;
}

/**
 * Detect whether a string starts with a Unicode emoji character.
 * Covers Emoji_Presentation, Extended_Pictographic, and common sequences.
 */
function isEmoji(str: string): boolean {
  if (!str) return false;
  // Use Unicode property escapes for reliable emoji detection
  // Matches: emoji presentation chars, skin-tone modifiers, ZWJ sequences, keycap sequences, flag sequences
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
  return emojiRegex.test(str);
}

/**
 * Map of kebab-case Lucide icon names → icon data.
 * ~200 commonly-used icons. Unknown names fall back to Circle.
 */
const ICON_MAP: Record<string, LucideIconData> = {
  // Layout & Navigation
  'layout-dashboard': LayoutDashboard,
  'home': Home,
  'menu': Menu,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'external-link': ExternalLink,
  'more-horizontal': MoreHorizontal,

  // Actions
  'plus': Plus,
  'minus': Minus,
  'x': X,
  'check': Check,
  'search': Search,
  'filter': Filter,
  'settings': Settings,
  'edit': Edit,
  'trash-2': Trash2,
  'trash': Trash2,
  'copy': Copy,
  'download': Download,
  'upload': Upload,
  'share-2': Share2,
  'share': Share2,
  'send': Send,
  'refresh-cw': RefreshCw,
  'refresh': RefreshCw,
  'rotate-ccw': RotateCcw,
  'save': Save,
  'archive': Archive,
  'scissors': Scissors,
  'square-pen': SquarePen,
  'wand-sparkles': WandSparkles,

  // Communication
  'mail': Mail,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  'phone': Phone,
  'bell': Bell,
  'bell-off': BellOff,
  'bell-ring': BellRing,
  'inbox': Inbox,
  'megaphone': Megaphone,
  'at-sign': AtSign,

  // Content & Media
  'file': File,
  'file-text': FileText,
  'image': Image,
  'video': Video,
  'music': Music,
  'folder': Folder,
  'folder-open': FolderOpen,
  'bookmark': Bookmark,
  'newspaper': Newspaper,
  'clipboard-list': ClipboardList,
  'list-ordered': ListOrdered,
  'scroll-text': ScrollText,

  // Data & Charts
  'bar-chart-2': BarChart2,
  'bar-chart': BarChart2,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'activity': Activity,
  'zap': Zap,
  'database': Database,
  'percent': Percent,
  'gauge': Gauge,

  // Users & Social
  'user': User,
  'users': Users,
  'user-plus': UserPlus,
  'user-check': UserCheck,
  'heart': Heart,
  'heart-pulse': HeartPulse,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  'star': Star,
  'github': Github,
  'globe': Globe,
  'link': Link,

  // Status & Feedback
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'circle-alert': CircleAlert,
  'info': Info,
  'help-circle': HelpCircle,
  'check-circle': CheckCircle,
  'circle-check': CircleCheck,
  'x-circle': XCircle,
  'circle-x': CircleX,
  'clock': Clock,
  'timer': Timer,
  'loader': Loader,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,

  // Shapes
  'circle': Circle,
  'circle-dot': CircleDot,
  'square': Square,
  'triangle': Triangle,
  'hexagon': Hexagon,

  // Objects & Misc
  'calendar': Calendar,
  'map-pin': MapPin,
  'tag': Tag,
  'hash': Hash,
  'lock': Lock,
  'unlock': Unlock,
  'key': Key,
  'eye': Eye,
  'eye-off': EyeOff,
  'sparkles': Sparkles,
  'lightbulb': Lightbulb,
  'rocket': Rocket,
  'target': Target,
  'flag': Flag,
  'award': Award,
  'gift': Gift,
  'book-open': BookOpen,
  'cpu': Cpu,
  'code': Code,
  'terminal': Terminal,
  'layers': Layers,
  'package': Package,
  'box': Box,
  'wifi': Wifi,
  'cloud': Cloud,
  'cloud-off': CloudOff,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-sun': CloudSun,
  'sun': Sun,
  'moon': Moon,
  'compass': Compass,
  'umbrella': Umbrella,

  // Weather & Nature
  'wind': Wind,
  'thermometer': Thermometer,
  'droplets': Droplets,
  'droplet': Droplet,
  'water': Droplets, // alias: AI often uses "water" for humidity
  'waves': Waves,
  'flame': Flame,
  'fire': Flame,     // alias
  'snowflake': Snowflake,
  'mountain': Mountain,
  'tree-pine': TreePine,
  'tree': TreePine,  // alias
  'leaf': Leaf,
  'sprout': Sprout,
  'apple': Apple,

  // Finance
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'banknote': Banknote,
  'coins': Coins,
  'piggy-bank': PiggyBank,

  // Buildings & Places
  'landmark': Landmark,
  'building': Building,
  'building-2': Building2,
  'school': School,
  'hospital': Hospital,
  'factory': Factory,
  'warehouse': Warehouse,
  'store': Store,

  // Transport
  'car': Car,
  'plane': Plane,
  'ship': Ship,
  'bike': Bike,
  'bus': Bus,
  'truck': Truck,

  // Tools
  'hammer': Hammer,
  'wrench': Wrench,
  'plug': Plug,
  'power': Power,

  // Tech & Devices
  'monitor': Monitor,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'laptop': Laptop,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'gamepad': Gamepad,
  'battery': Battery,
  'battery-charging': BatteryCharging,
  'bluetooth': Bluetooth,
  'volume': Volume,
  'volume-x': VolumeX,
  'headphones': Headphones,
  'speaker': Speaker,
  'tv': Tv,
  'radio': Radio,

  // Media Controls
  'skip-forward': SkipForward,
  'skip-back': SkipBack,
  'repeat': Repeat,
  'shuffle': Shuffle,
  'maximize': Maximize,
  'minimize': Minimize,
  'fullscreen': Fullscreen,

  // Science
  'brain': Brain,
  'atom': Atom,

  // Commerce
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,

  // Food & Drink
  'coffee': Coffee,
  'glass-water': GlassWater,

  // Misc
  'grip': Grip,
  'palette': Palette,
  'paintbrush': Paintbrush,
  'mic': Mic,
  'camera': Camera,
  'printer': Printer,
  'watch': Watch,
  'joystick': Joystick,
};
