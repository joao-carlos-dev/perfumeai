
DELETE FROM perfume_notes;
DELETE FROM perfumes;

INSERT INTO notes (name, family, icon, color, description) VALUES
  ('Tabaco', 'Especiaria', '🚬', '#8B5A2B', 'Folha de tabaco quente e densa'),
  ('Cafe', 'Doce', '☕', '#4B2E20', 'Cafe arabico torrado'),
  ('Maca Verde', 'Frutada', '🍏', '#A8E063', 'Maca verde fresca'),
  ('Gengibre', 'Especiaria', '🫚', '#D9A066', 'Gengibre picante'),
  ('Salvia', 'Aromatica', '🌿', '#7BA17B', 'Salvia herbal'),
  ('Betula', 'Madeira', '🪵', '#5C4033', 'Betula esfumacada'),
  ('Groselha Preta', 'Frutada', '🍇', '#3D1E2E', 'Cassis frutado'),
  ('Coco', 'Doce', '🥥', '#F5DEB3', 'Coco cremoso tropical'),
  ('Manga', 'Frutada', '🥭', '#FFB347', 'Manga madura'),
  ('Maracuja', 'Frutada', '🟡', '#F5C518', 'Maracuja exotico'),
  ('Heliotropio', 'Floral', '🌸', '#E6B8C6', 'Heliotropio amendoado'),
  ('Praline', 'Doce', '🍬', '#A0522D', 'Praline de avela'),
  ('Almiscar', 'Amadeirada', '🤍', '#E5E4E2', 'Almiscar suave')
ON CONFLICT (name) DO NOTHING;

DO $body$
DECLARE
  v_perfume_id UUID;
  n_pimenta UUID := (SELECT id FROM notes WHERE name='Pimenta Rosa');
  n_tabaco UUID := (SELECT id FROM notes WHERE name='Tabaco');
  n_cafe UUID := (SELECT id FROM notes WHERE name='Cafe');
  n_baunilha UUID := (SELECT id FROM notes WHERE name='Baunilha');
  n_ambar UUID := (SELECT id FROM notes WHERE name='Ambar');
  n_canela UUID := (SELECT id FROM notes WHERE name='Canela');
  n_maca UUID := (SELECT id FROM notes WHERE name='Maca Verde');
  n_bergamota UUID := (SELECT id FROM notes WHERE name='Bergamota');
  n_lavanda UUID := (SELECT id FROM notes WHERE name='Lavanda');
  n_gengibre UUID := (SELECT id FROM notes WHERE name='Gengibre');
  n_salvia UUID := (SELECT id FROM notes WHERE name='Salvia');
  n_limao UUID := (SELECT id FROM notes WHERE name='Limao');
  n_betula UUID := (SELECT id FROM notes WHERE name='Betula');
  n_groselha UUID := (SELECT id FROM notes WHERE name='Groselha Preta');
  n_musgo UUID := (SELECT id FROM notes WHERE name='Musgo');
  n_praline UUID := (SELECT id FROM notes WHERE name='Praline');
  n_frutas UUID := (SELECT id FROM notes WHERE name='Frutas Vermelhas');
  n_morango UUID := (SELECT id FROM notes WHERE name='Morango');
  n_helio UUID := (SELECT id FROM notes WHERE name='Heliotropio');
  n_jasmim UUID := (SELECT id FROM notes WHERE name='Jasmim');
  n_coco UUID := (SELECT id FROM notes WHERE name='Coco');
  n_manga UUID := (SELECT id FROM notes WHERE name='Manga');
  n_maracuja UUID := (SELECT id FROM notes WHERE name='Maracuja');
  n_almiscar UUID := (SELECT id FROM notes WHERE name='Almiscar');
  n_sandalo UUID := (SELECT id FROM notes WHERE name='Sândalo');
BEGIN
  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Asad', 'Lattafa', 'male', 'Alternativa famosa ao Dior Sauvage Elixir. Quente, especiada e densa - pimenta preta, tabaco, cafe e baunilha sobre ambar. Maduro e elegante para noites e climas amenos.',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', 2022, '$$', true, 0.92)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_pimenta, 'top', 1.0),
    (v_perfume_id, n_bergamota, 'top', 0.7),
    (v_perfume_id, n_tabaco, 'heart', 1.0),
    (v_perfume_id, n_cafe, 'heart', 0.9),
    (v_perfume_id, n_canela, 'heart', 0.7),
    (v_perfume_id, n_baunilha, 'base', 1.0),
    (v_perfume_id, n_ambar, 'base', 0.9);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('9PM', 'Afnan', 'male', 'Inspirado no Jean Paul Gaultier Ultra Male. Doce, frutado e jovial - maca verde e bergamota abrindo para baunilha cremosa com canela. O rei das baladas.',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800', 2019, '$$', true, 0.95)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_maca, 'top', 1.0),
    (v_perfume_id, n_bergamota, 'top', 0.8),
    (v_perfume_id, n_canela, 'heart', 0.9),
    (v_perfume_id, n_lavanda, 'heart', 0.5),
    (v_perfume_id, n_baunilha, 'base', 1.0),
    (v_perfume_id, n_ambar, 'base', 0.7);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Fakhar Black', 'Lattafa', 'male', 'Inspirado no YSL Y EDP. Perfume azul, fresco e versatil - maca, gengibre, lavanda e salvia. Limpo, levemente adocicado e facil de agradar.',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800', 2021, '$$', true, 0.88)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_maca, 'top', 0.9),
    (v_perfume_id, n_gengibre, 'top', 0.8),
    (v_perfume_id, n_bergamota, 'top', 0.6),
    (v_perfume_id, n_lavanda, 'heart', 1.0),
    (v_perfume_id, n_salvia, 'heart', 0.8),
    (v_perfume_id, n_almiscar, 'base', 0.9),
    (v_perfume_id, n_ambar, 'base', 0.6);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Club de Nuit Intense Man', 'Armaf', 'male', 'O clone mais famoso do Creed Aventus. Frutado, citrico e esfumacado - limao na abertura, betula e groselha preta na secagem. Versatil e campeao de elogios.',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800', 2015, '$$', false, 0.97)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_limao, 'top', 1.0),
    (v_perfume_id, n_bergamota, 'top', 0.8),
    (v_perfume_id, n_maca, 'top', 0.6),
    (v_perfume_id, n_groselha, 'heart', 1.0),
    (v_perfume_id, n_jasmim, 'heart', 0.5),
    (v_perfume_id, n_betula, 'base', 1.0),
    (v_perfume_id, n_musgo, 'base', 0.8),
    (v_perfume_id, n_ambar, 'base', 0.7);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Khamrah Qahwa', 'Lattafa', 'unisex', 'Variacao do Khamrah com nota distinta de cafe arabe. Gourmand quente e licoroso - canela, praline, frutas secas, cafe e baunilha. Quase uma sobremesa em frasco.',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800', 2023, '$$', true, 0.90)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_canela, 'top', 1.0),
    (v_perfume_id, n_cafe, 'top', 0.9),
    (v_perfume_id, n_praline, 'heart', 1.0),
    (v_perfume_id, n_frutas, 'heart', 0.7),
    (v_perfume_id, n_baunilha, 'base', 1.0),
    (v_perfume_id, n_ambar, 'base', 0.9);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Supremacy Not Only Intense', 'Afnan', 'male', 'Comparado ao Creed Aventus e Hacivat, mas mais denso e musgoso. Frutas negras e bergamota evoluem para musgo de carvalho e ambar cinzento. Performance brutal.',
    'https://images.unsplash.com/photo-1610113413200-78cb3d33ef33?w=800', 2022, '$$$', true, 0.86)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_bergamota, 'top', 0.8),
    (v_perfume_id, n_groselha, 'top', 0.9),
    (v_perfume_id, n_frutas, 'heart', 1.0),
    (v_perfume_id, n_jasmim, 'heart', 0.5),
    (v_perfume_id, n_musgo, 'base', 1.0),
    (v_perfume_id, n_ambar, 'base', 1.0),
    (v_perfume_id, n_sandalo, 'base', 0.7);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Yara', 'Lattafa', 'female', 'Doce, cremoso e atalcado. Lembra milkshake de morango e marshmallow - orquidea, heliotropio, frutas e baunilha. Suave, reconfortante e muito feminino.',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=800', 2020, '$$', true, 0.96)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_morango, 'top', 1.0),
    (v_perfume_id, n_frutas, 'top', 0.7),
    (v_perfume_id, n_helio, 'heart', 1.0),
    (v_perfume_id, n_jasmim, 'heart', 0.6),
    (v_perfume_id, n_baunilha, 'base', 1.0),
    (v_perfume_id, n_almiscar, 'base', 0.8);

  INSERT INTO perfumes (name, brand, gender, description, image_url, year, price_range, is_new, popularity_score)
  VALUES ('Yara Tous', 'Lattafa', 'female', 'Versao tropical e solar da linha Yara. Manga, coco e maracuja com fundo de jasmim. Vibrante e alegre - ferias na praia em frasco.',
    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800', 2023, '$$', true, 0.89)
  RETURNING id INTO v_perfume_id;
  INSERT INTO perfume_notes (perfume_id, note_id, note_type, intensity) VALUES
    (v_perfume_id, n_manga, 'top', 1.0),
    (v_perfume_id, n_maracuja, 'top', 0.9),
    (v_perfume_id, n_coco, 'heart', 1.0),
    (v_perfume_id, n_jasmim, 'heart', 0.8),
    (v_perfume_id, n_baunilha, 'base', 0.7),
    (v_perfume_id, n_almiscar, 'base', 0.7);
END $body$;
