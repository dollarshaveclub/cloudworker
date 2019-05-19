const { atob } = require('../base64')

describe('atob', () => {
  test('it decodes strings', () => {
    const signature = 's/K04BUnN5ENwHBUTliO/6Qfzkvo7xZuixxwdoTLq60GvXBCIHDAkq5JtGEjFXaZKQg2paFH/kkKRNCSxHpq3MysYIo6/z34kzGiREJryxBjSBGIwtDQPnAkylogiZJhvlm7wYcDJ6HfNgJIcToOv9kqeijsRlVsGCsfENpPoManCSgbHTEFJEfOtb17wtlMA3bw4/a71mf+3vP+tdjofuoQhN+1GwplhYM+pUZZ5bEbv0Q0Z1fYL4qB2rMch2uowg7oFS7pr3mqbwhhOq/PlQuU1lNg763t+OFlIH9f3dUq1BOSe2VmmjAwzb1+RZ2O3B8Pez6fkJl10pj5YVHdAg'
    expect(() => atob(signature)).not.toThrow()
  })
})
