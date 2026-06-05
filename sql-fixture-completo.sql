-- ================================================================
-- MIGRACIÓN COMPLETA — Prode Mundial 2026
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Limpiar datos existentes
delete from public.predictions;
delete from public.special_predictions;
delete from public.matches;
select setval(pg_get_serial_sequence('public.matches', 'id'), 1, false);

-- 2. Agregar columnas nuevas
alter table public.matches
  add column if not exists venue text,
  add column if not exists match_time text,
  add column if not exists match_number int unique;

-- 3. Insertar los 104 partidos
insert into public.matches (match_number, date, match_time, group_name, home, away, phase, venue) values

-- ── GRUPO A ─────────────────────────────────────────────────────
(1,  '11 Jun', '15:00', 'A', 'México',             'Sudáfrica',          'groups', 'Ciudad de México'),
(2,  '11 Jun', '22:00', 'A', 'República de Corea', 'República Checa',    'groups', 'Guadalajara'),
(3,  '18 Jun', '12:00', 'A', 'República Checa',    'Sudáfrica',          'groups', 'Atlanta'),
(4,  '18 Jun', '21:00', 'A', 'México',             'República de Corea', 'groups', 'Guadalajara'),
(5,  '24 Jun', '21:00', 'A', 'República Checa',    'México',             'groups', 'Ciudad de México'),
(6,  '24 Jun', '21:00', 'A', 'Sudáfrica',          'República de Corea', 'groups', 'Monterrey'),

-- ── GRUPO B ─────────────────────────────────────────────────────
(7,  '12 Jun', '15:00', 'B', 'Canadá',              'Bosnia y Herzegovina', 'groups', 'Toronto'),
(8,  '13 Jun', '15:00', 'B', 'Catar',               'Suiza',               'groups', 'Bahía de San Francisco'),
(9,  '18 Jun', '15:00', 'B', 'Suiza',               'Bosnia y Herzegovina', 'groups', 'Los Ángeles'),
(10, '18 Jun', '18:00', 'B', 'Canadá',              'Catar',               'groups', 'BC Place Vancouver'),
(11, '24 Jun', '15:00', 'B', 'Suiza',               'Canadá',              'groups', 'BC Place Vancouver'),
(12, '24 Jun', '15:00', 'B', 'Bosnia y Herzegovina','Catar',               'groups', 'Seattle'),

-- ── GRUPO C ─────────────────────────────────────────────────────
(13, '13 Jun', '18:00', 'C', 'Brasil',    'Marruecos', 'groups', 'Nueva York / Nueva Jersey'),
(14, '13 Jun', '21:00', 'C', 'Haití',     'Escocia',   'groups', 'Boston'),
(15, '19 Jun', '18:00', 'C', 'Escocia',   'Marruecos', 'groups', 'Boston'),
(16, '19 Jun', '21:00', 'C', 'Brasil',    'Haití',     'groups', 'Filadelfia'),
(17, '24 Jun', '18:00', 'C', 'Escocia',   'Brasil',    'groups', 'Miami'),
(18, '24 Jun', '18:00', 'C', 'Marruecos', 'Haití',     'groups', 'Atlanta'),

-- ── GRUPO D ─────────────────────────────────────────────────────
(19, '12 Jun', '21:00', 'D', 'Estados Unidos', 'Paraguay',  'groups', 'Los Ángeles'),
(20, '13 Jun', '00:00', 'D', 'Australia',      'Turquía',   'groups', 'BC Place Vancouver'),
(21, '19 Jun', '15:00', 'D', 'Estados Unidos', 'Australia', 'groups', 'Seattle'),
(22, '19 Jun', '00:00', 'D', 'Turquía',        'Paraguay',  'groups', 'Bahía de San Francisco'),
(23, '25 Jun', '22:00', 'D', 'Turquía',        'Estados Unidos', 'groups', 'Los Ángeles'),
(24, '25 Jun', '22:00', 'D', 'Paraguay',       'Australia', 'groups', 'Bahía de San Francisco'),

-- ── GRUPO E ─────────────────────────────────────────────────────
(25, '14 Jun', '13:00', 'E', 'Alemania',        'Curazao',        'groups', 'Houston'),
(26, '14 Jun', '19:00', 'E', 'Costa de Marfil', 'Ecuador',        'groups', 'Filadelfia'),
(27, '20 Jun', '16:00', 'E', 'Alemania',        'Costa de Marfil','groups', 'Toronto'),
(28, '20 Jun', '22:00', 'E', 'Ecuador',         'Curazao',        'groups', 'Kansas City'),
(29, '25 Jun', '16:00', 'E', 'Curazao',         'Costa de Marfil','groups', 'Filadelfia'),
(30, '25 Jun', '16:00', 'E', 'Ecuador',         'Alemania',       'groups', 'Nueva York / Nueva Jersey'),

-- ── GRUPO F ─────────────────────────────────────────────────────
(31, '14 Jun', '16:00', 'F', 'Países Bajos', 'Japón',  'groups', 'Dallas'),
(32, '14 Jun', '22:00', 'F', 'Suecia',       'Túnez',  'groups', 'Monterrey'),
(33, '20 Jun', '13:00', 'F', 'Países Bajos', 'Suecia', 'groups', 'Houston'),
(34, '20 Jun', '00:00', 'F', 'Túnez',        'Japón',  'groups', 'Monterrey'),
(35, '25 Jun', '19:00', 'F', 'Japón',        'Suecia', 'groups', 'Dallas'),
(36, '25 Jun', '19:00', 'F', 'Túnez',        'Países Bajos', 'groups', 'Kansas City'),

-- ── GRUPO G ─────────────────────────────────────────────────────
(37, '15 Jun', '15:00', 'G', 'Bélgica',    'Egipto',       'groups', 'Seattle'),
(38, '15 Jun', '21:00', 'G', 'RI de Irán', 'Nueva Zelanda','groups', 'Los Ángeles'),
(39, '21 Jun', '15:00', 'G', 'Bélgica',    'RI de Irán',   'groups', 'Los Ángeles'),
(40, '21 Jun', '21:00', 'G', 'Nueva Zelanda','Egipto',      'groups', 'BC Place Vancouver'),
(41, '26 Jun', '23:00', 'G', 'Egipto',     'RI de Irán',   'groups', 'Seattle'),
(42, '26 Jun', '23:00', 'G', 'Nueva Zelanda','Bélgica',     'groups', 'BC Place Vancouver'),

-- ── GRUPO H ─────────────────────────────────────────────────────
(43, '15 Jun', '12:00', 'H', 'España',      'Cabo Verde', 'groups', 'Atlanta'),
(44, '15 Jun', '18:00', 'H', 'Arabia Saudí','Uruguay',    'groups', 'Miami'),
(45, '21 Jun', '12:00', 'H', 'España',      'Arabia Saudí','groups','Atlanta'),
(46, '21 Jun', '18:00', 'H', 'Uruguay',     'Cabo Verde', 'groups', 'Miami'),
(47, '26 Jun', '20:00', 'H', 'Cabo Verde',  'Arabia Saudí','groups','Houston'),
(48, '26 Jun', '20:00', 'H', 'Uruguay',     'España',     'groups', 'Guadalajara'),

-- ── GRUPO I ─────────────────────────────────────────────────────
(49, '16 Jun', '15:00', 'I', 'Francia',  'Senegal', 'groups', 'Nueva York / Nueva Jersey'),
(50, '16 Jun', '18:00', 'I', 'Irak',     'Noruega', 'groups', 'Boston'),
(51, '22 Jun', '17:00', 'I', 'Francia',  'Irak',    'groups', 'Filadelfia'),
(52, '22 Jun', '20:00', 'I', 'Noruega',  'Senegal', 'groups', 'Nueva York / Nueva Jersey'),
(53, '26 Jun', '15:00', 'I', 'Noruega',  'Francia', 'groups', 'Boston'),
(54, '26 Jun', '15:00', 'I', 'Senegal',  'Irak',    'groups', 'Toronto'),

-- ── GRUPO J ─────────────────────────────────────────────────────
(55, '16 Jun', '21:00', 'J', 'Argentina', 'Argelia',  'groups', 'Kansas City'),
(56, '16 Jun', '00:00', 'J', 'Austria',   'Jordania', 'groups', 'Bahía de San Francisco'),
(57, '22 Jun', '13:00', 'J', 'Argentina', 'Austria',  'groups', 'Dallas'),
(58, '22 Jun', '23:00', 'J', 'Jordania',  'Argelia',  'groups', 'Bahía de San Francisco'),
(59, '27 Jun', '22:00', 'J', 'Argelia',   'Austria',  'groups', 'Kansas City'),
(60, '27 Jun', '22:00', 'J', 'Jordania',  'Argentina','groups', 'Dallas'),

-- ── GRUPO K ─────────────────────────────────────────────────────
(61, '17 Jun', '13:00', 'K', 'Portugal',   'RD Congo',   'groups', 'Houston'),
(62, '17 Jun', '22:00', 'K', 'Uzbekistán', 'Colombia',   'groups', 'Ciudad de México'),
(63, '23 Jun', '13:00', 'K', 'Portugal',   'Uzbekistán', 'groups', 'Houston'),
(64, '23 Jun', '22:00', 'K', 'Colombia',   'RD Congo',   'groups', 'Guadalajara'),
(65, '27 Jun', '19:30', 'K', 'Colombia',   'Portugal',   'groups', 'Miami'),
(66, '27 Jun', '19:30', 'K', 'RD Congo',   'Uzbekistán', 'groups', 'Atlanta'),

-- ── GRUPO L ─────────────────────────────────────────────────────
(67, '17 Jun', '16:00', 'L', 'Inglaterra', 'Croacia',   'groups', 'Dallas'),
(68, '17 Jun', '19:00', 'L', 'Ghana',      'Panamá',    'groups', 'Toronto'),
(69, '23 Jun', '16:00', 'L', 'Inglaterra', 'Ghana',     'groups', 'Boston'),
(70, '23 Jun', '19:00', 'L', 'Panamá',     'Croacia',   'groups', 'Toronto'),
(71, '27 Jun', '17:00', 'L', 'Panamá',     'Inglaterra','groups', 'Nueva York / Nueva Jersey'),
(72, '27 Jun', '17:00', 'L', 'Croacia',    'Ghana',     'groups', 'Filadelfia'),

-- ── RONDA DE 32 ─────────────────────────────────────────────────
(73, '28 Jun', null, null, '2º Grupo A',     '2º Grupo B',       'r32', 'Los Ángeles'),
(74, '29 Jun', null, null, '1º Grupo E',     '3º (A/B/C/D/F)',   'r32', 'Boston'),
(75, '29 Jun', null, null, '1º Grupo F',     '2º Grupo C',       'r32', 'Monterrey'),
(76, '29 Jun', null, null, '1º Grupo C',     '2º Grupo F',       'r32', 'Houston'),
(77, '30 Jun', null, null, '1º Grupo I',     '3º (C/D/F/G/H)',   'r32', 'Nueva York / Nueva Jersey'),
(78, '30 Jun', null, null, '2º Grupo E',     '2º Grupo I',       'r32', 'Dallas'),
(79, '30 Jun', null, null, '1º Grupo A',     '3º (C/E/F/H/I)',   'r32', 'Ciudad de México'),
(80, '1 Jul',  null, null, '1º Grupo L',     '3º (E/H/I/J/K)',   'r32', 'Atlanta'),
(81, '1 Jul',  null, null, '1º Grupo D',     '3º (B/E/F/I/J)',   'r32', 'Bahía de San Francisco'),
(82, '1 Jul',  null, null, '1º Grupo G',     '3º (A/E/H/I/J)',   'r32', 'Seattle'),
(83, '2 Jul',  null, null, '2º Grupo K',     '2º Grupo L',       'r32', 'Toronto'),
(84, '2 Jul',  null, null, '1º Grupo H',     '2º Grupo J',       'r32', 'Los Ángeles'),
(85, '2 Jul',  null, null, '1º Grupo B',     '3º (E/F/G/I/J)',   'r32', 'BC Place Vancouver'),
(86, '3 Jul',  null, null, '1º Grupo J',     '2º Grupo H',       'r32', 'Miami'),
(87, '3 Jul',  null, null, '1º Grupo K',     '3º (D/E/I/J/L)',   'r32', 'Kansas City'),
(88, '3 Jul',  null, null, '2º Grupo D',     '2º Grupo G',       'r32', 'Dallas'),

-- ── OCTAVOS DE FINAL ────────────────────────────────────────────
(89,  '4 Jul',  null, null, 'Gan. P74', 'Gan. P77', 'r16', 'Filadelfia'),
(90,  '4 Jul',  null, null, 'Gan. P73', 'Gan. P75', 'r16', 'Houston'),
(91,  '5 Jul',  null, null, 'Gan. P76', 'Gan. P78', 'r16', 'Nueva York / Nueva Jersey'),
(92,  '5 Jul',  null, null, 'Gan. P79', 'Gan. P80', 'r16', 'Ciudad de México'),
(93,  '6 Jul',  null, null, 'Gan. P83', 'Gan. P84', 'r16', 'Dallas'),
(94,  '6 Jul',  null, null, 'Gan. P81', 'Gan. P82', 'r16', 'Seattle'),
(95,  '7 Jul',  null, null, 'Gan. P86', 'Gan. P88', 'r16', 'Atlanta'),
(96,  '7 Jul',  null, null, 'Gan. P85', 'Gan. P87', 'r16', 'BC Place Vancouver'),

-- ── CUARTOS DE FINAL ────────────────────────────────────────────
(97,  '9 Jul',  null, null, 'Gan. P89', 'Gan. P90',  'qf', 'Boston'),
(98,  '10 Jul', null, null, 'Gan. P93', 'Gan. P94',  'qf', 'Los Ángeles'),
(99,  '11 Jul', null, null, 'Gan. P91', 'Gan. P92',  'qf', 'Miami'),
(100, '11 Jul', null, null, 'Gan. P95', 'Gan. P96',  'qf', 'Kansas City'),

-- ── SEMIFINALES ─────────────────────────────────────────────────
(101, '14 Jul', null, null, 'Gan. P97',  'Gan. P98',  'sf', 'Dallas'),
(102, '15 Jul', null, null, 'Gan. P99',  'Gan. P100', 'sf', 'Atlanta'),

-- ── TERCER PUESTO ───────────────────────────────────────────────
(103, '18 Jul', null, null, 'Per. P101', 'Per. P102', '3rd', 'Miami'),

-- ── FINAL ───────────────────────────────────────────────────────
(104, '19 Jul', null, null, 'Gan. P101', 'Gan. P102', 'final', 'Nueva York / Nueva Jersey');
