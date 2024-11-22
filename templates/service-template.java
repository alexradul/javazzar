{{{fileComment}}}

package {{servicePackage}};

import {{entityClassQualifiedName}};
import {{repositoryPackage}}.{{entityClassName}}Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class {{entityClassName}}Service {
    private static final Logger logger = LoggerFactory.getLogger({{entityClassName}}Service.class);

    private final {{entityClassName}}Repository repository;

    @Autowired
    public {{entityClassName}}Service({{entityClassName}}Repository repository) {
        this.repository = repository;
    }

    public Iterable<{{entityClassName}}> findAll() {
        return repository.findAll();
    }

    public {{entityClassName}} findOne({{primaryKeyType}} id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Cannot find {{entityClassName}} by " + id));
    }

    public {{entityClassName}} save({{entityClassName}} entity) {
        return repository.save(entity);
    }

    public void delete({{entityClassName}} entity) {
        repository.delete(entity);
    }

    public void delete({{primaryKeyType}} id) {
        delete(findOne(id));
    }
}