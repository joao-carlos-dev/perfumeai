
-- TABELAS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🌿',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.perfumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'unisex',
  description TEXT,
  image_url TEXT,
  year INT,
  price_range TEXT,
  is_new BOOLEAN NOT NULL DEFAULT false,
  popularity_score NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.perfume_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'heart',
  intensity NUMERIC NOT NULL DEFAULT 1.0,
  UNIQUE (perfume_id, note_id)
);
CREATE INDEX idx_perfume_notes_perfume ON public.perfume_notes(perfume_id);
CREATE INDEX idx_perfume_notes_note ON public.perfume_notes(note_id);

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_note_ids UUID[] NOT NULL DEFAULT '{}',
  disliked_note_ids UUID[] NOT NULL DEFAULT '{}',
  preferred_families TEXT[] NOT NULL DEFAULT '{}',
  gender_preference TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  perfume_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_user_created ON public.chat_messages(user_id, created_at);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfume_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Notes are viewable by everyone" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Perfumes are viewable by everyone" ON public.perfumes FOR SELECT USING (true);
CREATE POLICY "Perfume notes are viewable by everyone" ON public.perfume_notes FOR SELECT USING (true);

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED NOTAS
INSERT INTO public.notes (name, family, icon, color, description) VALUES
  ('Rosa','Floral','🌹','#EC4899','Floral romântico e clássico'),
  ('Jasmim','Floral','🌼','#F9FAFB','Floral branco intenso e sensual'),
  ('Lavanda','Floral','💜','#8B5CF6','Aromática herbácea e calmante'),
  ('Sândalo','Madeira','🪵','#A16207','Madeira cremosa e meditativa'),
  ('Cedro','Madeira','🌲','#65A30D','Madeira seca e elegante'),
  ('Oud','Madeira','🖤','#1F2937','Madeira preciosa do Oriente Médio'),
  ('Bergamota','Citrica','🍋','#FACC15','Cítrico fresco e luminoso'),
  ('Limao','Citrica','🟡','#EAB308','Cítrico vibrante e energizante'),
  ('Laranja','Citrica','🍊','#F97316','Cítrico doce e solar'),
  ('Pimenta Rosa','Especiaria','🌶️','#F43F5E','Picante e efervescente'),
  ('Canela','Especiaria','🟤','#92400E','Quente, doce e envolvente'),
  ('Cardamomo','Especiaria','🌿','#10B981','Especiaria verde e refinada'),
  ('Morango','Frutada','🍓','#EF4444','Frutada doce e brincalhona'),
  ('Frutas Vermelhas','Frutada','🍒','#DC2626','Mix sucoso de frutas vermelhas'),
  ('Baunilha','Doce','🍦','#FDE68A','Gourmand cremoso e reconfortante'),
  ('Caramelo','Doce','🍯','#D97706','Doce âmbar gourmand'),
  ('Ambar','Amadeirada','✨','#F59E0B','Resinoso quente e sensual'),
  ('Patchouli','Amadeirada','🍂','#78350F','Terroso intenso e magnético'),
  ('Musgo','Aquatica','🌊','#0EA5E9','Verde úmido e mineral'),
  ('Sal Marinho','Aquatica','🧂','#38BDF8','Aquático fresco e salgado');

-- SEED PERFUMES
DO $seed$
DECLARE
  rosa UUID; jasmim UUID; lavanda UUID;
  sandalo UUID; cedro UUID; oud UUID;
  bergamota UUID; limao UUID; laranja UUID;
  pimenta UUID; canela UUID; cardamomo UUID;
  morango UUID; vermelhas UUID;
  baunilha UUID; caramelo UUID;
  ambar UUID; patchouli UUID;
  musgo UUID; sal UUID;
  pid UUID;
BEGIN
  SELECT id INTO rosa FROM public.notes WHERE name='Rosa';
  SELECT id INTO jasmim FROM public.notes WHERE name='Jasmim';
  SELECT id INTO lavanda FROM public.notes WHERE name='Lavanda';
  SELECT id INTO sandalo FROM public.notes WHERE name='Sândalo';
  SELECT id INTO cedro FROM public.notes WHERE name='Cedro';
  SELECT id INTO oud FROM public.notes WHERE name='Oud';
  SELECT id INTO bergamota FROM public.notes WHERE name='Bergamota';
  SELECT id INTO limao FROM public.notes WHERE name='Limao';
  SELECT id INTO laranja FROM public.notes WHERE name='Laranja';
  SELECT id INTO pimenta FROM public.notes WHERE name='Pimenta Rosa';
  SELECT id INTO canela FROM public.notes WHERE name='Canela';
  SELECT id INTO cardamomo FROM public.notes WHERE name='Cardamomo';
  SELECT id INTO morango FROM public.notes WHERE name='Morango';
  SELECT id INTO vermelhas FROM public.notes WHERE name='Frutas Vermelhas';
  SELECT id INTO baunilha FROM public.notes WHERE name='Baunilha';
  SELECT id INTO caramelo FROM public.notes WHERE name='Caramelo';
  SELECT id INTO ambar FROM public.notes WHERE name='Ambar';
  SELECT id INTO patchouli FROM public.notes WHERE name='Patchouli';
  SELECT id INTO musgo FROM public.notes WHERE name='Musgo';
  SELECT id INTO sal FROM public.notes WHERE name='Sal Marinho';

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Noir Velvet','Maison Lumière','feminino','Floral oriental envolvente, com rosa e oud em destaque.',2023,'$$$',true,0.92) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',1.0),(gen_random_uuid(),pid,rosa,'heart',1.8),
    (gen_random_uuid(),pid,oud,'base',1.6),(gen_random_uuid(),pid,patchouli,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Solaris','Atelier Sud','unisex','Cítrico solar com base amadeirada elegante.',2024,'$$',true,0.85) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',1.6),(gen_random_uuid(),pid,laranja,'top',1.4),
    (gen_random_uuid(),pid,cedro,'heart',1.2),(gen_random_uuid(),pid,ambar,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Bois Sacré','Maison Lumière','masculino','Madeiras nobres com toque de especiarias.',2022,'$$$$',false,0.78) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,cardamomo,'top',1.2),(gen_random_uuid(),pid,sandalo,'heart',1.8),
    (gen_random_uuid(),pid,cedro,'heart',1.4),(gen_random_uuid(),pid,oud,'base',1.5);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Sucré Folie','Petit Parfum','feminino','Gourmand brincalhão com baunilha e morango.',2023,'$$',false,0.81) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,morango,'top',1.4),(gen_random_uuid(),pid,vermelhas,'heart',1.2),
    (gen_random_uuid(),pid,baunilha,'base',1.8),(gen_random_uuid(),pid,caramelo,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Marée Bleue','Atelier Sud','unisex','Aquático fresco com musgo e sal marinho.',2024,'$$',true,0.74) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,limao,'top',1.4),(gen_random_uuid(),pid,sal,'heart',1.6),
    (gen_random_uuid(),pid,musgo,'base',1.4),(gen_random_uuid(),pid,cedro,'base',0.8);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Rosa Imperial','Maison Lumière','feminino','Soliflore de rosa com pimenta rosa cintilante.',2021,'$$$',false,0.70) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,pimenta,'top',1.4),(gen_random_uuid(),pid,rosa,'heart',2.0),
    (gen_random_uuid(),pid,patchouli,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Lavande Nuit','Provence Co.','unisex','Lavanda aromática em base de baunilha.',2020,'$',false,0.66) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,lavanda,'top',1.8),(gen_random_uuid(),pid,bergamota,'top',1.0),
    (gen_random_uuid(),pid,baunilha,'base',1.4);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Oud Royal','Orient Maison','masculino','Oud puro envolto em âmbar e patchouli.',2019,'$$$$',false,0.88) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,cardamomo,'top',1.0),(gen_random_uuid(),pid,oud,'heart',2.0),
    (gen_random_uuid(),pid,ambar,'base',1.6),(gen_random_uuid(),pid,patchouli,'base',1.4);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Citrus Pop','Petit Parfum','unisex','Explosão cítrica refrescante para o dia.',2024,'$',true,0.72) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,limao,'top',1.8),(gen_random_uuid(),pid,bergamota,'top',1.4),
    (gen_random_uuid(),pid,laranja,'heart',1.2),(gen_random_uuid(),pid,cedro,'base',0.6);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Velvet Vanilla','Petit Parfum','feminino','Baunilha cremosa com toque de caramelo.',2023,'$$',false,0.79) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,laranja,'top',1.0),(gen_random_uuid(),pid,baunilha,'heart',2.0),
    (gen_random_uuid(),pid,caramelo,'base',1.6),(gen_random_uuid(),pid,sandalo,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Foret Profonde','Atelier Sud','unisex','Madeiras úmidas e musgo verdejante.',2022,'$$$',false,0.68) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',0.8),(gen_random_uuid(),pid,cedro,'heart',1.6),
    (gen_random_uuid(),pid,musgo,'base',1.6),(gen_random_uuid(),pid,patchouli,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Spice Route','Orient Maison','masculino','Especiarias quentes com madeiras nobres.',2021,'$$$',false,0.75) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,canela,'top',1.4),(gen_random_uuid(),pid,cardamomo,'heart',1.4),
    (gen_random_uuid(),pid,sandalo,'base',1.2),(gen_random_uuid(),pid,ambar,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Jasmin Étoilé','Maison Lumière','feminino','Jasmim luminoso e sensual.',2020,'$$$',false,0.83) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',1.0),(gen_random_uuid(),pid,jasmim,'heart',2.0),
    (gen_random_uuid(),pid,sandalo,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Berry Crush','Petit Parfum','feminino','Frutas vermelhas suculentas com baunilha.',2024,'$',true,0.77) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,morango,'top',1.4),(gen_random_uuid(),pid,vermelhas,'heart',1.8),
    (gen_random_uuid(),pid,baunilha,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Ambre Nuit','Maison Lumière','unisex','Âmbar resinoso com baunilha e madeiras.',2018,'$$$$',false,0.86) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,pimenta,'top',1.0),(gen_random_uuid(),pid,ambar,'heart',1.8),
    (gen_random_uuid(),pid,baunilha,'base',1.4),(gen_random_uuid(),pid,sandalo,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Cedar Storm','Atelier Sud','masculino','Cedro tempestuoso com pimenta e musgo.',2023,'$$',true,0.71) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,pimenta,'top',1.4),(gen_random_uuid(),pid,cedro,'heart',1.8),
    (gen_random_uuid(),pid,musgo,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Rose Oud','Orient Maison','feminino','Encontro clássico de rosa e oud.',2019,'$$$$',false,0.90) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,pimenta,'top',1.0),(gen_random_uuid(),pid,rosa,'heart',1.8),
    (gen_random_uuid(),pid,oud,'base',1.8),(gen_random_uuid(),pid,ambar,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Mar do Norte','Atelier Sud','unisex','Brisa marítima fresca e mineral.',2022,'$$',false,0.64) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,limao,'top',1.6),(gen_random_uuid(),pid,sal,'heart',1.8),
    (gen_random_uuid(),pid,musgo,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Doux Caramel','Petit Parfum','feminino','Caramelo gourmand com toque amadeirado.',2024,'$$',true,0.69) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,laranja,'top',1.0),(gen_random_uuid(),pid,caramelo,'heart',1.8),
    (gen_random_uuid(),pid,baunilha,'base',1.4),(gen_random_uuid(),pid,sandalo,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Cardamome Noir','Orient Maison','masculino','Cardamomo sofisticado com âmbar.',2023,'$$$',false,0.73) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,cardamomo,'top',1.8),(gen_random_uuid(),pid,canela,'heart',1.0),
    (gen_random_uuid(),pid,ambar,'base',1.4),(gen_random_uuid(),pid,oud,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Lavande Provence','Provence Co.','unisex','Lavanda clássica solar.',2017,'$',false,0.60) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,lavanda,'top',2.0),(gen_random_uuid(),pid,limao,'top',1.0),
    (gen_random_uuid(),pid,musgo,'base',0.8);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Patchouli Mystique','Orient Maison','unisex','Patchouli profundo e magnético.',2020,'$$$',false,0.67) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',1.0),(gen_random_uuid(),pid,patchouli,'heart',2.0),
    (gen_random_uuid(),pid,sandalo,'base',1.2);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Fleur de Sel','Atelier Sud','feminino','Floral salgado contemporâneo.',2024,'$$$',true,0.76) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,sal,'top',1.4),(gen_random_uuid(),pid,jasmim,'heart',1.6),
    (gen_random_uuid(),pid,musgo,'base',1.0),(gen_random_uuid(),pid,sandalo,'base',1.0);

  INSERT INTO public.perfumes (name,brand,gender,description,year,price_range,is_new,popularity_score)
  VALUES ('Vanille Royale','Maison Lumière','feminino','Baunilha luxuosa em âmbar dourado.',2022,'$$$$',false,0.84) RETURNING id INTO pid;
  INSERT INTO public.perfume_notes VALUES
    (gen_random_uuid(),pid,bergamota,'top',1.0),(gen_random_uuid(),pid,baunilha,'heart',2.0),
    (gen_random_uuid(),pid,ambar,'base',1.6),(gen_random_uuid(),pid,sandalo,'base',1.2);
END
$seed$;
